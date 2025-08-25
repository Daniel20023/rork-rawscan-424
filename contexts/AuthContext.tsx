import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  sendOTP: (email: string, fullName?: string, createAccount?: boolean) => Promise<{ error: AuthError | null }>;
  verifyOTP: (email: string, token: string, userPreferences?: any) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  syncUserPreferences: (preferences: any) => Promise<{ error: any | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription: any;
    let retryCount = 0;
    const maxRetries = 3;
    
    // Warm up the browser for OAuth on mobile
    if (Platform.OS !== 'web') {
      WebBrowser.warmUpAsync().catch(() => {
        // Ignore warming errors
      });
    }
    
    // Get initial session with better error handling and retry logic
    const initializeAuth = async () => {
      try {
        console.log(`Initializing auth... (attempt ${retryCount + 1}/${maxRetries})`);
        
        // Check if we have cached session data first
        try {
          const cachedSession = await AsyncStorage.getItem('supabase.auth.token');
          if (cachedSession) {
            console.log('Found cached session data');
          }
        } catch {
          console.log('No cached session found');
        }
        
        // Try to get session with graceful fallback and timeout
        try {
          console.log('Attempting to get session...');
          
          // Add timeout to session request
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Auth initialization timeout')), 5000)
          );
          
          const { data: { session: fetchedSession }, error } = await Promise.race([
            sessionPromise,
            timeoutPromise
          ]);
          
          if (error) {
            console.error('Auth session error:', error.message);
            throw error;
          } else {
            console.log('Auth successful:', fetchedSession?.user?.email || 'No user');
            setSession(fetchedSession);
            setUser(fetchedSession?.user ?? null);
            retryCount = 0; // Reset retry count on success
          }
          
        } catch (attemptError) {
          console.error(`Auth attempt ${retryCount + 1} failed:`, attemptError);
          
          if (retryCount < maxRetries - 1) {
            retryCount++;
            console.log(`Retrying auth initialization in 1 second... (${retryCount}/${maxRetries})`);
            setTimeout(() => initializeAuth(), 1000);
            return; // Don't set loading to false yet
          } else {
            console.error('Max auth retry attempts reached, continuing without session');
            // Continue without session - app should still work
            setSession(null);
            setUser(null);
          }
        }
        
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Set to null state so app can continue
        setSession(null);
        setUser(null);
      } finally {
        if (retryCount >= maxRetries - 1 || retryCount === 0) {
          setLoading(false);
        }
      }
    };
    
    // Listen for auth changes with error handling
    const setupAuthListener = () => {
      try {
        const { data } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email || 'No user');
            
            // Create profile for new users (OAuth or email)
            if (event === 'SIGNED_IN' && session?.user) {
              try {
                // Wait a bit for database triggers to complete
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const { data: existingProfile } = await supabase
                  .from('profiles')
                  .select('id')
                  .eq('id', session.user.id)
                  .single();

                if (!existingProfile) {
                  console.log('Profile not found, creating manually...');
                  const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                      id: session.user.id,
                      email: session.user.email!,
                      full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || null,
                      avatar_url: session.user.user_metadata?.avatar_url || null,
                    }, {
                      onConflict: 'id'
                    });

                  if (profileError) {
                    console.error('Error creating profile on sign in:', profileError);
                  } else {
                    console.log('Profile created successfully');
                  }
                } else {
                  console.log('Profile already exists');
                }
                  
                // Mark onboarding as complete for new users
                try {
                  const STORAGE_KEY = "rawscan_user_preferences";
                  const defaultPreferences = {
                    name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                    gender: '',
                    bodyGoals: [],
                    healthGoals: [],
                    dietGoals: [],
                    accomplishmentGoals: [],
                    hasCompletedOnboarding: true,
                  };
                  
                  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPreferences));
                  console.log('Marked onboarding as complete for new OAuth user');
                } catch (storageError) {
                  console.error('Error saving onboarding completion for OAuth user:', storageError);
                }
              } catch (error) {
                console.error('Error handling profile on sign in:', error);
              }
            }
            
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
          }
        );
        
        subscription = data.subscription;
      } catch (error) {
        console.error('Error setting up auth state listener:', error);
        // Continue without listener - app should still work
        setLoading(false);
      }
    };
    
    // Initialize auth and setup listener immediately
    const timer = setTimeout(() => {
      initializeAuth();
      setupAuthListener();
    }, 100); // Reduced delay for faster startup
    
    return () => {
      clearTimeout(timer);
      if (subscription) {
        subscription.unsubscribe();
      }
      // Cool down the browser
      if (Platform.OS !== 'web') {
        WebBrowser.coolDownAsync().catch(() => {
          // Ignore cooling errors
        });
      }
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    // Profile will be created by database trigger after email confirmation
    if (!error && data.user) {
      console.log('User signup successful, profile will be created after email confirmation');
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    try {
      // Clear stored user preferences on sign out
      const STORAGE_KEY = "rawscan_user_preferences";
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('Cleared user preferences on sign out');
    } catch (error) {
      console.error('Error clearing user preferences on sign out:', error);
    }
    
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const signInWithGoogle = async () => {
    try {
      if (Platform.OS === 'web') {
        // For web, use the standard OAuth flow
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        return { error };
      } else {
        // For mobile, use WebBrowser for OAuth
        const redirectUrl = Linking.createURL('/');
        console.log('Google OAuth redirect URL:', redirectUrl);
        
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
          },
        });
        
        if (error) {
          console.error('Google OAuth error:', error);
          return { error };
        }
        
        if (data?.url) {
          console.log('Opening Google OAuth URL:', data.url);
          
          // Open the OAuth URL in the browser
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl
          );
          
          console.log('WebBrowser result:', result);
          
          if (result.type === 'success' && result.url) {
            // Parse the URL to get the session
            const url = new URL(result.url);
            const accessToken = url.searchParams.get('access_token');
            const refreshToken = url.searchParams.get('refresh_token');
            
            if (accessToken && refreshToken) {
              // Set the session manually
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (sessionError) {
                console.error('Error setting session:', sessionError);
                return { error: sessionError };
              }
              
              return { error: null };
            } else {
              return { error: { message: 'Failed to get authentication tokens' } as AuthError };
            }
          } else if (result.type === 'cancel') {
            return { error: { message: 'Authentication cancelled' } as AuthError };
          } else {
            return { error: { message: 'Authentication failed' } as AuthError };
          }
        } else {
          return { error: { message: 'No OAuth URL received' } as AuthError };
        }
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Google sign-in failed';
      return { error: { message: errorMessage } as AuthError };
    }
  };

  const sendOTP = async (email: string, fullName?: string, createAccount: boolean = false) => {
    try {
      console.log('Sending OTP to:', email, createAccount ? 'for account creation' : 'for sign-in only');
      console.log('Supabase client initialized:', !!supabase);
      console.log('Network connectivity check starting...');
      
      if (createAccount) {
        // For account creation (from questionnaire), allow creating new users
        console.log('Creating new account and sending OTP');
        
        // Add timeout to the request
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout - please check your internet connection')), 10000)
        );
        
        const otpPromise = supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true, // Allow creating new users
            data: {
              full_name: fullName || null,
            },
          },
        });
        
        const { data, error } = await Promise.race([otpPromise, timeoutPromise]);
        
        if (error) {
          console.error('Supabase OTP error details:', {
            message: error.message,
            status: error.status,
            name: error.name
          });
          console.error('Full error object:', error);
          return { error };
        } else {
          console.log('OTP sent successfully for new account creation', data);
        }
        
        return { error };
      } else {
        // For existing users (sign-in flow), check if user exists first
        const { data: existingUser, error: profileError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', email)
          .single();
        
        if (!existingUser || profileError) {
          console.log('User not found for email:', email, 'Profile error:', profileError);
          return { error: { message: 'Account not found. Please contact support to create an account.' } as AuthError };
        }
        
        console.log('User found, sending OTP for sign-in');
        
        // Add timeout to the request
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout - please check your internet connection')), 10000)
        );
        
        const otpPromise = supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false, // Don't create new users for sign-in
          },
        });
        
        const { data, error } = await Promise.race([otpPromise, timeoutPromise]);
        
        if (error) {
          console.error('Supabase OTP error details:', {
            message: error.message,
            status: error.status,
            name: error.name
          });
          console.error('Full error object:', error);
          return { error };
        } else {
          console.log('OTP sent successfully', data);
        }
        
        return { error };
      }
    } catch (err) {
      console.error('Unexpected error in sendOTP:', err);
      
      let errorMessage = 'Failed to send verification code. Please try again.';
      if (err instanceof Error) {
        if (err.message.includes('timeout') || err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network connection failed. Please check your internet connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      return { error: { message: errorMessage } as AuthError };
    }
  };

  const verifyOTP = async (email: string, token: string, userPreferences?: any) => {
    try {
      console.log('Verifying OTP for:', email);
      
      // Add timeout to the request
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - please check your internet connection')), 10000)
      );
      
      const verifyPromise = supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      
      const { data, error } = await Promise.race([verifyPromise, timeoutPromise]);
      
      if (error) {
        console.error('OTP verification error:', error);
        return { error: error };
      }

      // Create or update profile when user verifies OTP
      if (data.user) {
        try {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .single();

          if (!existingProfile) {
            console.log('Profile not found after OTP verification, creating manually...');
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                id: data.user.id,
                email: data.user.email!,
                full_name: data.user.user_metadata?.full_name || null,
                avatar_url: data.user.user_metadata?.avatar_url || null,
              }, {
                onConflict: 'id'
              });

            if (profileError) {
              console.error('Error creating profile:', profileError);
            } else {
              console.log('Profile created successfully after OTP verification');
            }
          } else {
            console.log('Profile already exists after OTP verification');
          }

          // Handle user preferences after email verification
          try {
            const STORAGE_KEY = "rawscan_user_preferences";
            
            // If userPreferences are provided from questionnaire, use them
            if (userPreferences) {
              console.log('Using questionnaire preferences after email verification:', userPreferences);
              // Ensure onboarding is marked as complete
              const completePreferences = {
                ...userPreferences,
                hasCompletedOnboarding: true,
              };
              
              // Save to local storage
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(completePreferences));
              console.log('Saved questionnaire preferences after email verification');
            } else {
              // Fallback to default preferences if no questionnaire data
              const defaultPreferences = {
                name: data.user.user_metadata?.full_name || '',
                gender: '',
                bodyGoals: [],
                healthGoals: [],
                dietGoals: [],
                accomplishmentGoals: [],
                hasCompletedOnboarding: true,
              };
              
              // Save to local storage
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPreferences));
              console.log('Saved default preferences after email verification');
            }
          } catch (storageError) {
            console.error('Error saving preferences after email verification:', storageError);
          }

          // Sync user preferences to Supabase if provided
          if (userPreferences && data.user) {
            // Create a temporary sync function that uses the verified user
            const tempSyncPreferences = async (prefs: any) => {
              try {
                console.log('Syncing user preferences to Supabase:', prefs);
                
                // Check if preferences already exist
                const { data: existingPrefs } = await supabase
                  .from('user_preferences')
                  .select('id')
                  .eq('user_id', data.user!.id)
                  .single();

                const preferencesData = {
                  user_id: data.user!.id,
                  dietary_restrictions: prefs.dietGoals || [],
                  health_goals: {
                    bodyGoals: prefs.bodyGoals || [],
                    healthGoals: prefs.healthGoals || [],
                    accomplishmentGoals: prefs.accomplishmentGoals || [],
                    gender: prefs.gender || null,
                    name: prefs.name || null
                  },
                  notifications_enabled: true
                };

                // Use upsert to handle both insert and update cases
                const { error } = await supabase
                  .from('user_preferences')
                  .upsert(preferencesData, {
                    onConflict: 'user_id'
                  });

                if (error) {
                  console.error('Error syncing user preferences:', error);
                } else {
                  console.log('User preferences synced successfully');
                }

                return { error };
              } catch (err) {
                console.error('Unexpected error syncing preferences:', err);
                return { error: err };
              }
            };
            
            await tempSyncPreferences(userPreferences);
          }
        } catch (profileError) {
          console.error('Error handling profile:', profileError);
        }
      }

      return { error };
    } catch (err) {
      console.error('Unexpected error in verifyOTP:', err);
      
      let errorMessage = 'Failed to verify code. Please try again.';
      if (err instanceof Error) {
        if (err.message.includes('timeout') || err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network connection failed. Please check your internet connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      return { error: { message: errorMessage } as AuthError };
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  };

  const syncUserPreferences = async (preferences: any) => {
    try {
      if (!user?.id) {
        return { error: { message: 'User not authenticated' } };
      }

      console.log('Syncing user preferences to Supabase:', preferences);
      
      // Check if preferences already exist
      const { data: existingPrefs } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const preferencesData = {
        user_id: user.id,
        dietary_restrictions: preferences.dietGoals || [],
        health_goals: {
          bodyGoals: preferences.bodyGoals || [],
          healthGoals: preferences.healthGoals || [],
          accomplishmentGoals: preferences.accomplishmentGoals || [],
          gender: preferences.gender || null,
          name: preferences.name || null
        },
        notifications_enabled: true
      };

      // Use upsert to handle both insert and update cases
      const { error } = await supabase
        .from('user_preferences')
        .upsert(preferencesData, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error syncing user preferences:', error);
      } else {
        console.log('User preferences synced successfully');
      }

      return { error };
    } catch (err) {
      console.error('Unexpected error syncing preferences:', err);
      return { error: err };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    sendOTP,
    verifyOTP,
    signOut,
    resetPassword,
    syncUserPreferences,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}