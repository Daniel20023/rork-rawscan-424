import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  Heart, 
  Activity,
  Zap,
  ChevronLeft,
  Check,
  User,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Leaf,
  Beef,
  Wheat,
  Droplets,
  Shield,
  Sparkles,
  Battery,
  Smile,
  Scale,
  Save
} from "lucide-react-native";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";

const GENDER_OPTIONS = [
  { id: "male", label: "Male", icon: <User size={24} /> },
  { id: "female", label: "Female", icon: <User size={24} /> },
  { id: "other", label: "Other", icon: <Users size={24} /> },
];

const BODY_GOALS = [
  { id: "lose_weight", label: "Lose weight", icon: <TrendingDown size={24} /> },
  { id: "gain_weight", label: "Gain weight", icon: <TrendingUp size={24} /> },
  { id: "maintain_weight", label: "Maintain weight", icon: <Minus size={24} /> },
];

const HEALTH_GOALS = [
  { id: "balanced", label: "Balanced", icon: <Scale size={24} /> },
  { id: "low_sugar", label: "Low sugar", icon: <Droplets size={24} /> },
  { id: "high_protein", label: "High Protein", icon: <Activity size={24} /> },
  { id: "low_fat", label: "Low fat", icon: <Shield size={24} /> },
  { id: "keto", label: "Keto", icon: <Zap size={24} /> },
];

const DIET_GOALS = [
  { id: "whole_foods", label: "Whole Foods", icon: <Leaf size={24} /> },
  { id: "vegan", label: "Vegan", icon: <Leaf size={24} /> },
  { id: "carnivore", label: "Carnivore", icon: <Beef size={24} /> },
  { id: "gluten_free", label: "Gluten free", icon: <Wheat size={24} /> },
  { id: "vegetarian", label: "Vegetarian", icon: <Leaf size={24} /> },
  { id: "balanced", label: "Balanced", icon: <Scale size={24} /> },
];

const ACCOMPLISHMENT_GOALS = [
  { id: "eat_and_live_healthier", label: "Eat and live healthier", icon: <Heart size={24} /> },
  { id: "boost_energy_and_mood", label: "Boost my energy and mood", icon: <Battery size={24} /> },
  { id: "feel_better_about_my_body", label: "Feel better about my body", icon: <Smile size={24} /> },
  { id: "clear_up_my_skin", label: "Clear up my skin", icon: <Sparkles size={24} /> },
];

export default function EditPreferencesScreen() {
  const { 
    name: currentName,
    gender: currentGender,
    body_goal: currentBodyGoal,
    health_goals: currentHealthGoals,
    diet_type: currentDietType,
    accomplish_future: currentAccomplishmentGoals,
    setUserPreferences 
  } = useUserPreferences();
  
  const [step, setStep] = useState(1);
  const [name, setName] = useState<string>(currentName || "");
  const [selectedGender, setSelectedGender] = useState<string>(currentGender || "");
  const [selectedBodyGoal, setSelectedBodyGoal] = useState<string>(currentBodyGoal || "");
  const [selectedHealthGoals, setSelectedHealthGoals] = useState<string[]>(currentHealthGoals || []);
  const [selectedDietType, setSelectedDietType] = useState<string>(currentDietType || "");
  const [selectedAccomplishmentGoals, setSelectedAccomplishmentGoals] = useState<string[]>(currentAccomplishmentGoals || []);
  const [loading, setLoading] = useState<boolean>(false);

  // Initialize state with current preferences
  useEffect(() => {
    setName(currentName || "");
    setSelectedGender(currentGender || "");
    setSelectedBodyGoal(currentBodyGoal || "");
    setSelectedHealthGoals(currentHealthGoals || []);
    setSelectedDietType(currentDietType || "");
    setSelectedAccomplishmentGoals(currentAccomplishmentGoals || []);
  }, [currentName, currentGender, currentBodyGoal, currentHealthGoals, currentDietType, currentAccomplishmentGoals]);

  const selectBodyGoal = (goalId: string) => {
    setSelectedBodyGoal(goalId);
  };

  const toggleHealthGoal = (goalId: string) => {
    setSelectedHealthGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const selectDietType = (dietId: string) => {
    setSelectedDietType(dietId);
  };

  const toggleAccomplishmentGoal = (goalId: string) => {
    setSelectedAccomplishmentGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedPreferences = {
        name,
        gender: selectedGender,
        body_goal: selectedBodyGoal as "lose_weight" | "gain_weight" | "maintain_weight",
        health_goals: selectedHealthGoals as ("low_sugar" | "high_protein" | "low_fat" | "keto" | "balanced")[],
        diet_type: selectedDietType as "whole_foods" | "vegan" | "carnivore" | "gluten_free" | "vegetarian" | "balanced",
        avoid_ingredients: [],
        strictness: {
          diet_type: 0.8,
          health_goals: 0.7
        },
        accomplish_future: selectedAccomplishmentGoals as ("eat_and_live_healthier" | "boost_energy_and_mood" | "feel_better_about_my_body" | "clear_up_my_skin")[],
        hasCompletedOnboarding: true,
      };
      
      await setUserPreferences(updatedPreferences);
      Alert.alert('Success', 'Your preferences have been updated!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return name.trim() !== "";
      case 2: return selectedGender !== "";
      case 3: return selectedBodyGoal !== "";
      case 4: return selectedHealthGoals.length > 0;
      case 5: return selectedDietType !== "";
      case 6: return selectedAccomplishmentGoals.length > 0;
      default: return true;
    }
  };

  const totalSteps = 6;
  const progress = step / totalSteps;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => step > 1 ? setStep(step - 1) : router.back()}
          >
            <ChevronLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Preferences</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{step} of {totalSteps}</Text>
        </View>

        {step === 1 ? (
          // Name Input
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's your name?</Text>
            <Text style={styles.stepSubtitle}>
              This will be used to personalize your experience
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              placeholderTextColor="#999"
              testID="nameInput"
            />
          </View>
        ) : step === 2 ? (
          // Gender Selection
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Choose your gender</Text>
            <Text style={styles.stepSubtitle}>
              This will be used to calibrate your custom needs
            </Text>
            
            <View style={styles.optionsContainer}>
              {GENDER_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    selectedGender === option.id && styles.optionCardSelected
                  ]}
                  onPress={() => setSelectedGender(option.id)}
                  testID={`gender-${option.id}`}
                >
                  <View style={[
                    styles.optionIcon,
                    selectedGender === option.id && styles.optionIconSelected
                  ]}>
                    {option.icon}
                  </View>
                  <Text style={[
                    styles.optionLabel,
                    selectedGender === option.id && styles.optionLabelSelected
                  ]}>
                    {option.label}
                  </Text>
                  {selectedGender === option.id && (
                    <View style={styles.checkMark}>
                      <Check size={16} color="#FF0040" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : step === 3 ? (
          // Body Goals
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What are your body goals?</Text>
            <Text style={styles.stepSubtitle}>
              Choose one that best describes your goal
            </Text>
            
            <View style={styles.goalsGrid}>
              {BODY_GOALS.map(goal => (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.goalCard,
                    selectedBodyGoal === goal.id && styles.goalCardSelected
                  ]}
                  onPress={() => selectBodyGoal(goal.id)}
                  testID={`body-goal-${goal.id}`}
                >
                  <View style={[
                    styles.goalIcon,
                    selectedBodyGoal === goal.id && styles.goalIconSelected
                  ]}>
                    {goal.icon}
                  </View>
                  <Text style={[
                    styles.goalLabel,
                    selectedBodyGoal === goal.id && styles.goalLabelSelected
                  ]}>
                    {goal.label}
                  </Text>
                  {selectedBodyGoal === goal.id && (
                    <View style={styles.checkMark}>
                      <Check size={16} color="#FF0040" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : step === 4 ? (
          // Health Goals
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Health goals</Text>
            <Text style={styles.stepSubtitle}>
              Select all that apply to customize your experience
            </Text>
            
            <View style={styles.goalsGrid}>
              {HEALTH_GOALS.map(goal => (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.goalCard,
                    selectedHealthGoals.includes(goal.id) && styles.goalCardSelected
                  ]}
                  onPress={() => toggleHealthGoal(goal.id)}
                  testID={`health-goal-${goal.id}`}
                >
                  <View style={[
                    styles.goalIcon,
                    selectedHealthGoals.includes(goal.id) && styles.goalIconSelected
                  ]}>
                    {goal.icon}
                  </View>
                  <Text style={[
                    styles.goalLabel,
                    selectedHealthGoals.includes(goal.id) && styles.goalLabelSelected
                  ]}>
                    {goal.label}
                  </Text>
                  {selectedHealthGoals.includes(goal.id) && (
                    <View style={styles.checkMark}>
                      <Check size={16} color="#FF0040" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : step === 5 ? (
          // Diet Goals
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Diet goals</Text>
            <Text style={styles.stepSubtitle}>
              Choose one that best describes your diet
            </Text>
            
            <View style={styles.goalsGrid}>
              {DIET_GOALS.map(goal => (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.goalCard,
                    selectedDietType === goal.id && styles.goalCardSelected
                  ]}
                  onPress={() => selectDietType(goal.id)}
                  testID={`diet-goal-${goal.id}`}
                >
                  <View style={[
                    styles.goalIcon,
                    selectedDietType === goal.id && styles.goalIconSelected
                  ]}>
                    {goal.icon}
                  </View>
                  <Text style={[
                    styles.goalLabel,
                    selectedDietType === goal.id && styles.goalLabelSelected
                  ]}>
                    {goal.label}
                  </Text>
                  {selectedDietType === goal.id && (
                    <View style={styles.checkMark}>
                      <Check size={16} color="#FF0040" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          // Accomplishment Goals
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What would you like to accomplish?</Text>
            <Text style={styles.stepSubtitle}>
              Select all that resonate with your journey
            </Text>
            
            <View style={styles.goalsGrid}>
              {ACCOMPLISHMENT_GOALS.map(goal => (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.goalCard,
                    selectedAccomplishmentGoals.includes(goal.id) && styles.goalCardSelected
                  ]}
                  onPress={() => toggleAccomplishmentGoal(goal.id)}
                  testID={`accomplishment-goal-${goal.id}`}
                >
                  <View style={[
                    styles.goalIcon,
                    selectedAccomplishmentGoals.includes(goal.id) && styles.goalIconSelected
                  ]}>
                    {goal.icon}
                  </View>
                  <Text style={[
                    styles.goalLabel,
                    selectedAccomplishmentGoals.includes(goal.id) && styles.goalLabelSelected
                  ]}>
                    {goal.label}
                  </Text>
                  {selectedAccomplishmentGoals.includes(goal.id) && (
                    <View style={styles.checkMark}>
                      <Check size={16} color="#FF0040" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          {step < totalSteps ? (
            <TouchableOpacity
              style={[styles.continueButton, !canProceed() && styles.continueButtonDisabled]}
              onPress={() => setStep(step + 1)}
              disabled={!canProceed()}
              testID="continue-button"
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading || !canProceed()}
              testID="save-button"
            >
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Preferences'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  progressBackground: {
    width: '100%',
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF0040',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 8,
    textAlign: "center",
  },
  stepSubtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    backgroundColor: "#F8F8F8",
    borderRadius: 16,
    padding: 16,
    fontSize: 18,
    color: "#333333",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    flexDirection: "row",
    gap: 16,
  },
  optionCardSelected: {
    backgroundColor: "#FF0040",
    borderColor: "#FF0040",
  },
  optionIcon: {
    opacity: 0.7,
  },
  optionIconSelected: {
    opacity: 1,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    flex: 1,
  },
  optionLabelSelected: {
    color: "#FFFFFF",
  },
  goalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  goalCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 16,
    padding: 16,
    width: "48%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  goalCardSelected: {
    backgroundColor: "#FF0040",
    borderColor: "#FF0040",
  },
  goalIcon: {
    marginBottom: 8,
  },
  goalIconSelected: {
    opacity: 1,
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    textAlign: "center",
  },
  goalLabelSelected: {
    color: "#FFFFFF",
  },
  checkMark: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 2,
  },
  footer: {
    marginTop: 32,
  },
  continueButton: {
    backgroundColor: "#FF0040",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  saveButton: {
    backgroundColor: "#FF0040",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});