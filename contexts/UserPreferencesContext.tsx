import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from '@/lib/supabase';

// Updated UserPreferences interface (allergen-free)
interface UserPreferences {
  name: string;
  gender?: string;
  body_goal: "lose_weight" | "gain_weight" | "maintain_weight";
  health_goals: ("low_sugar" | "high_protein" | "low_fat" | "keto" | "balanced")[];
  diet_type: "whole_foods" | "vegan" | "carnivore" | "gluten_free" | "vegetarian" | "balanced";
  avoid_ingredients?: ("seed_oils" | "artificial_colors")[];
  strictness: {
    diet_type: number;
    health_goals: number;
  };
  accomplish_future: (
    | "eat_and_live_healthier"
    | "boost_energy_and_mood"
    | "feel_better_about_my_body"
    | "clear_up_my_skin"
  )[];
  hasCompletedOnboarding: boolean;
  profilePicture?: string;
}

// Legacy interface for backward compatibility
interface LegacyUserPreferences {
  name: string;
  gender?: string;
  bodyGoals: string[];
  healthGoals: string[];
  dietGoals: string[];
  accomplishmentGoals: string[];
  hasCompletedOnboarding: boolean;
  profilePicture?: string;
}

const STORAGE_KEY = "rawscan_user_preferences";

// Helper functions to convert legacy data
function convertLegacyBodyGoal(legacyGoal: string): UserPreferences['body_goal'] {
  switch (legacyGoal) {
    case 'lose_weight': return 'lose_weight';
    case 'gain_weight': return 'gain_weight';
    case 'maintain_weight': return 'maintain_weight';
    default: return 'maintain_weight';
  }
}

function convertLegacyHealthGoals(legacyGoals: string[]): UserPreferences['health_goals'] {
  const validGoals: UserPreferences['health_goals'] = [];
  legacyGoals.forEach(goal => {
    switch (goal) {
      case 'low_sugar':
      case 'high_protein':
      case 'low_fat':
      case 'keto':
      case 'balanced':
        validGoals.push(goal);
        break;
    }
  });
  return validGoals;
}

function convertLegacyDietType(legacyDiet: string): UserPreferences['diet_type'] {
  switch (legacyDiet) {
    case 'whole_foods': return 'whole_foods';
    case 'vegan': return 'vegan';
    case 'carnivore': return 'carnivore';
    case 'gluten_free': return 'gluten_free';
    case 'vegetarian': return 'vegetarian';
    case 'balanced': return 'balanced';
    default: return 'balanced';
  }
}

function convertLegacyAccomplishmentGoals(legacyGoals: string[]): UserPreferences['accomplish_future'] {
  const validGoals: UserPreferences['accomplish_future'] = [];
  legacyGoals.forEach(goal => {
    switch (goal) {
      case 'eat_healthier':
        validGoals.push('eat_and_live_healthier');
        break;
      case 'boost_energy':
        validGoals.push('boost_energy_and_mood');
        break;
      case 'feel_better':
        validGoals.push('feel_better_about_my_body');
        break;
      case 'clear_skin':
        validGoals.push('clear_up_my_skin');
        break;
    }
  });
  return validGoals;
}

function convertLegacyPreferences(legacy: any): UserPreferences {
  // Check if it's already in new format
  if (legacy.body_goal !== undefined) {
    return legacy as UserPreferences;
  }
  
  // Convert from legacy format
  return {
    name: legacy.name || '',
    gender: legacy.gender || '',
    body_goal: convertLegacyBodyGoal(legacy.bodyGoals?.[0] || 'maintain_weight'),
    health_goals: convertLegacyHealthGoals(legacy.healthGoals || []),
    diet_type: convertLegacyDietType(legacy.dietGoals?.[0] || 'balanced'),
    avoid_ingredients: [],
    strictness: {
      diet_type: 0.8,
      health_goals: 0.7
    },
    accomplish_future: convertLegacyAccomplishmentGoals(legacy.accomplishmentGoals || []),
    hasCompletedOnboarding: legacy.hasCompletedOnboarding || false,
    profilePicture: legacy.profilePicture
  };
}

export const [UserPreferencesProvider, useUserPreferences] = createContextHook(() => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    name: "",
    gender: "",
    body_goal: "maintain_weight",
    health_goals: [],
    diet_type: "balanced",
    avoid_ingredients: [],
    strictness: {
      diet_type: 0.8,
      health_goals: 0.7
    },
    accomplish_future: [],
    hasCompletedOnboarding: false,
    profilePicture: undefined,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadPreferences = useCallback(async () => {
    try {
      console.log('Loading user preferences...');
      
      // First try to load from Supabase if user is authenticated
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('Loading preferences from Supabase for authenticated user');
          const { data: supabasePrefs } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (supabasePrefs) {
            // Convert Supabase data to UserPreferences format
            const convertedPrefs: UserPreferences = {
              name: supabasePrefs.display_name || '',
              gender: supabasePrefs.gender || '',
              body_goal: supabasePrefs.body_goal || 'maintain_weight',
              health_goals: Array.isArray(supabasePrefs.health_goals) ? supabasePrefs.health_goals : [],
              diet_type: supabasePrefs.diet_type || 'balanced',
              avoid_ingredients: Array.isArray(supabasePrefs.avoid_ingredients) ? supabasePrefs.avoid_ingredients : [],
              strictness: supabasePrefs.strictness || {
                diet_type: 0.8,
                health_goals: 0.7
              },
              accomplish_future: Array.isArray(supabasePrefs.accomplish_future) ? supabasePrefs.accomplish_future : [],
              hasCompletedOnboarding: supabasePrefs.onboarding_completed || false,
              profilePicture: undefined, // Not stored in user_preferences table
            };
            
            console.log('✅ Loaded user goals from Supabase:', {
              name: convertedPrefs.name,
              body_goal: convertedPrefs.body_goal,
              health_goals: convertedPrefs.health_goals,
              diet_type: convertedPrefs.diet_type,
              accomplish_future: convertedPrefs.accomplish_future
            });
            setPreferences(convertedPrefs);
            
            // Also save to local storage for offline access
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(convertedPrefs));
            setIsLoading(false);
            return;
          }
        }
      } catch (supabaseError) {
        console.log('Could not load from Supabase, falling back to local storage:', supabaseError instanceof Error ? supabaseError.message : String(supabaseError));
      }
      
      // Fallback to local storage
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert legacy format if needed
        const convertedPrefs = convertLegacyPreferences(parsed);
        console.log('✅ Loaded user goals from local storage:', {
          name: convertedPrefs.name,
          body_goal: convertedPrefs.body_goal,
          health_goals: convertedPrefs.health_goals,
          diet_type: convertedPrefs.diet_type,
          accomplish_future: convertedPrefs.accomplish_future
        });
        setPreferences(convertedPrefs);
      } else {
        console.log('No stored preferences found - user needs to complete onboarding');
      }
    } catch (error) {
      console.error("Error loading preferences:", error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
      console.log('Preferences loading complete');
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const setUserPreferences = useCallback(async (newPreferences: UserPreferences) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
      setPreferences(newPreferences);
      
      // Also sync to Supabase if user is authenticated
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('Syncing preferences to Supabase for authenticated user');
          
          // Check if preferences already exist
          const { data: existingPrefs } = await supabase
            .from('user_preferences')
            .select('id')
            .eq('user_id', user.id)
            .single();

          const preferencesData = {
            user_id: user.id,
            body_goal: newPreferences.body_goal,
            health_goals: newPreferences.health_goals,
            diet_type: newPreferences.diet_type,
            avoid_ingredients: newPreferences.avoid_ingredients || [],
            strictness: newPreferences.strictness,
            accomplish_future: newPreferences.accomplish_future,
            display_name: newPreferences.name || null,
            gender: newPreferences.gender || null,
            notifications_enabled: true,
            onboarding_completed: newPreferences.hasCompletedOnboarding
          };

          if (existingPrefs) {
            // Update existing preferences
            await supabase
              .from('user_preferences')
              .update(preferencesData)
              .eq('user_id', user.id);
          } else {
            // Insert new preferences
            await supabase
              .from('user_preferences')
              .insert(preferencesData);
          }
          
          console.log('Preferences synced to Supabase successfully');
        }
      } catch (supabaseError) {
        console.error('Error syncing user preferences:', supabaseError instanceof Error ? supabaseError.message : String(supabaseError));
      }
    } catch (error) {
      console.error("Error saving preferences:", error instanceof Error ? error.message : String(error));
    }
  }, []);

  const updateBodyGoal = useCallback(async (body_goal: UserPreferences['body_goal']) => {
    const updated = { ...preferences, body_goal };
    await setUserPreferences(updated);
  }, [preferences, setUserPreferences]);

  const updateHealthGoals = useCallback(async (health_goals: UserPreferences['health_goals']) => {
    const updated = { ...preferences, health_goals };
    await setUserPreferences(updated);
  }, [preferences, setUserPreferences]);

  const updateDietType = useCallback(async (diet_type: UserPreferences['diet_type']) => {
    const updated = { ...preferences, diet_type };
    await setUserPreferences(updated);
  }, [preferences, setUserPreferences]);

  const updateAccomplishmentGoals = useCallback(async (accomplish_future: UserPreferences['accomplish_future']) => {
    const updated = { ...preferences, accomplish_future };
    await setUserPreferences(updated);
  }, [preferences, setUserPreferences]);

  const updateAvoidIngredients = useCallback(async (avoid_ingredients: UserPreferences['avoid_ingredients']) => {
    const updated = { ...preferences, avoid_ingredients };
    await setUserPreferences(updated);
  }, [preferences, setUserPreferences]);

  const updateStrictness = useCallback(async (strictness: UserPreferences['strictness']) => {
    const updated = { ...preferences, strictness };
    await setUserPreferences(updated);
  }, [preferences, setUserPreferences]);

  const updateProfilePicture = useCallback(async (profilePicture: string) => {
    const updated = { ...preferences, profilePicture };
    await setUserPreferences(updated);
  }, [preferences, setUserPreferences]);

  const resetPreferences = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setPreferences({
        name: "",
        gender: "",
        body_goal: "maintain_weight",
        health_goals: [],
        diet_type: "balanced",
        avoid_ingredients: [],
        strictness: {
          diet_type: 0.8,
          health_goals: 0.7
        },
        accomplish_future: [],
        hasCompletedOnboarding: false,
        profilePicture: undefined,
      });
    } catch (error) {
      console.error("Error resetting preferences:", error instanceof Error ? error.message : String(error));
    }
  }, []);

  return useMemo(() => ({
    ...preferences,
    isLoading,
    setUserPreferences,
    updateBodyGoal,
    updateHealthGoals,
    updateDietType,
    updateAccomplishmentGoals,
    updateAvoidIngredients,
    updateStrictness,
    updateProfilePicture,
    resetPreferences,
  }), [preferences, isLoading, setUserPreferences, updateBodyGoal, updateHealthGoals, updateDietType, updateAccomplishmentGoals, updateAvoidIngredients, updateStrictness, updateProfilePicture, resetPreferences]);
});