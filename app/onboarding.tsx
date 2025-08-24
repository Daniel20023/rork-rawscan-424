import React, { useState } from "react";
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
  ChevronRight,
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
  Mail,
  Crown,
  Star
} from "lucide-react-native";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { useAuth } from "@/contexts/AuthContext";

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
  { id: "low_sugar", label: "Low sugar", icon: <Droplets size={24} /> },
  { id: "high_protein", label: "High Protein", icon: <Activity size={24} /> },
  { id: "low_fat", label: "Low fat", icon: <Shield size={24} /> },
  { id: "keto", label: "Keto", icon: <Zap size={24} /> },
  { id: "balanced", label: "Balanced", icon: <Scale size={24} /> },
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
  { id: "eat_healthier", label: "Eat and live healthier", icon: <Heart size={24} /> },
  { id: "boost_energy", label: "Boost my energy and mood", icon: <Battery size={24} /> },
  { id: "feel_better", label: "Feel better about my body", icon: <Smile size={24} /> },
  { id: "clear_skin", label: "Clear up my skin", icon: <Sparkles size={24} /> },
];

export default function OnboardingScreen() {
  const { setUserPreferences } = useUserPreferences();
  const { signInWithGoogle, sendOTP } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedGender, setSelectedGender] = useState<string>("");
  const [selectedBodyGoal, setSelectedBodyGoal] = useState<string>("");
  const [selectedHealthGoals, setSelectedHealthGoals] = useState<string[]>([]);
  const [selectedDietGoals, setSelectedDietGoals] = useState<string[]>([]);
  const [selectedAccomplishmentGoals, setSelectedAccomplishmentGoals] = useState<string[]>([]);
  
  // Auth states
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const toggleHealthGoal = (goalId: string) => {
    setSelectedHealthGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const toggleDietGoal = (goalId: string) => {
    setSelectedDietGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const toggleAccomplishmentGoal = (goalId: string) => {
    setSelectedAccomplishmentGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      // Prepare user preferences from questionnaire data
      const preferences = {
        name: "User", // Default name since we're not collecting it
        gender: selectedGender,
        body_goal: selectedBodyGoal as "lose_weight" | "gain_weight" | "maintain_weight" || "maintain_weight",
        health_goals: selectedHealthGoals as ("low_sugar" | "high_protein" | "low_fat" | "keto" | "balanced")[],
        diet_type: selectedDietGoals[0] as "whole_foods" | "vegan" | "carnivore" | "gluten_free" | "vegetarian" | "balanced" || "balanced",
        avoid_ingredients: [] as ("seed_oils" | "artificial_colors")[],
        strictness: {
          diet_type: 0.8,
          health_goals: 0.7
        },
        accomplish_future: selectedAccomplishmentGoals.map(goal => {
          switch (goal) {
            case 'eat_healthier': return 'eat_and_live_healthier';
            case 'boost_energy': return 'boost_energy_and_mood';
            case 'feel_better': return 'feel_better_about_my_body';
            case 'clear_skin': return 'clear_up_my_skin';
            default: return 'eat_and_live_healthier';
          }
        }) as ("eat_and_live_healthier" | "boost_energy_and_mood" | "feel_better_about_my_body" | "clear_up_my_skin")[],
        hasCompletedOnboarding: true,
      };
      
      console.log('Starting Google auth with questionnaire preferences:', preferences);
      
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Google auth error:', error);
        if (error.message === 'Authentication cancelled') {
          // User cancelled, don't show error
          return;
        }
        Alert.alert('Error', error.message || 'Google sign-in failed');
      } else {
        console.log('Google auth successful, saving preferences');
        // Save preferences and complete onboarding
        await setUserPreferences(preferences);
        router.replace("/" as any);
      }
    } catch (err) {
      console.error('Unexpected error in Google auth:', err);
      Alert.alert('Error', 'An unexpected error occurred during Google sign-in');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }



    setLoading(true);

    try {
      console.log('Starting email auth for:', email);
      
      // Prepare user preferences from questionnaire data
      const preferences = {
        name: "User", // Default name since we're not collecting it
        gender: selectedGender,
        body_goal: selectedBodyGoal as "lose_weight" | "gain_weight" | "maintain_weight" || "maintain_weight",
        health_goals: selectedHealthGoals as ("low_sugar" | "high_protein" | "low_fat" | "keto" | "balanced")[],
        diet_type: selectedDietGoals[0] as "whole_foods" | "vegan" | "carnivore" | "gluten_free" | "vegetarian" | "balanced" || "balanced",
        avoid_ingredients: [] as ("seed_oils" | "artificial_colors")[],
        strictness: {
          diet_type: 0.8,
          health_goals: 0.7
        },
        accomplish_future: selectedAccomplishmentGoals.map(goal => {
          switch (goal) {
            case 'eat_healthier': return 'eat_and_live_healthier';
            case 'boost_energy': return 'boost_energy_and_mood';
            case 'feel_better': return 'feel_better_about_my_body';
            case 'clear_skin': return 'clear_up_my_skin';
            default: return 'eat_and_live_healthier';
          }
        }) as ("eat_and_live_healthier" | "boost_energy_and_mood" | "feel_better_about_my_body" | "clear_up_my_skin")[],
        hasCompletedOnboarding: true,
      };
      
      console.log('User preferences from questionnaire:', preferences);
      
      const { error } = await sendOTP(email, "User", true); // Pass createAccount: true for new account creation

      if (error) {
        console.error('Email auth error:', error);
        Alert.alert('Error', error.message || 'Failed to send verification code');
      } else {
        console.log('Email auth successful, navigating to OTP screen with preferences');
        
        // Save preferences locally for immediate access
        await setUserPreferences(preferences);
        
        // Navigate to OTP verification screen with preferences
        router.push({
          pathname: '/verify-otp',
          params: {
            email,
            preferences: JSON.stringify(preferences),
          },
        });
      }
    } catch (err) {
      console.error('Unexpected error in handleEmailAuth:', err);
      Alert.alert('Error', 'An unexpected error occurred. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    router.replace("/" as any);
  };



  const canProceed = () => {
    switch (step) {
      case 1: return selectedGender !== "";
      case 2: return selectedBodyGoal !== "";
      case 3: return selectedHealthGoals.length > 0;
      case 4: return selectedDietGoals.length > 0;
      case 5: return selectedAccomplishmentGoals.length > 0;
      case 6: return email.trim() !== "";
      default: return true;
    }
  };

  const totalSteps = 5;
  const progress = step / totalSteps;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Bar */}
        {step >= 1 && step <= 5 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>{step} of {totalSteps}</Text>
          </View>
        )}
        {step === 1 ? (
          // Gender Selection
          <View style={styles.stepContainer}>
            <View style={styles.header}>
              <Text style={styles.logo}>RawScan</Text>
            </View>
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
        ) : step === 2 ? (
          // Body Goals
          <View style={styles.stepContainer}>
            <View style={styles.header}>
              <Text style={styles.logo}>RawScan</Text>
            </View>
            <Text style={styles.stepTitle}>What are your body goals?</Text>
            <Text style={styles.stepSubtitle}>
              This helps us personalize your nutrition recommendations
            </Text>
            
            <View style={styles.optionsContainer}>
              {BODY_GOALS.map(goal => (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.optionCard,
                    selectedBodyGoal === goal.id && styles.optionCardSelected
                  ]}
                  onPress={() => setSelectedBodyGoal(goal.id)}
                  testID={`body-goal-${goal.id}`}
                >
                  <View style={[
                    styles.optionIcon,
                    selectedBodyGoal === goal.id && styles.optionIconSelected
                  ]}>
                    {goal.icon}
                  </View>
                  <Text style={[
                    styles.optionLabel,
                    selectedBodyGoal === goal.id && styles.optionLabelSelected
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
        ) : step === 3 ? (
          // Health Goals
          <View style={styles.stepContainer}>
            <View style={styles.header}>
              <Text style={styles.logo}>RawScan</Text>
            </View>
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
        ) : step === 4 ? (
          // Diet Goals
          <View style={styles.stepContainer}>
            <View style={styles.header}>
              <Text style={styles.logo}>RawScan</Text>
            </View>
            <Text style={styles.stepTitle}>Diet goals</Text>
            <Text style={styles.stepSubtitle}>
              Select all that apply to your dietary preferences
            </Text>
            
            <View style={styles.goalsGrid}>
              {DIET_GOALS.map(goal => (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.goalCard,
                    selectedDietGoals.includes(goal.id) && styles.goalCardSelected
                  ]}
                  onPress={() => toggleDietGoal(goal.id)}
                  testID={`diet-goal-${goal.id}`}
                >
                  <View style={[
                    styles.goalIcon,
                    selectedDietGoals.includes(goal.id) && styles.goalIconSelected
                  ]}>
                    {goal.icon}
                  </View>
                  <Text style={[
                    styles.goalLabel,
                    selectedDietGoals.includes(goal.id) && styles.goalLabelSelected
                  ]}>
                    {goal.label}
                  </Text>
                  {selectedDietGoals.includes(goal.id) && (
                    <View style={styles.checkMark}>
                      <Check size={16} color="#FF0040" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : step === 5 ? (
          // Accomplishment Goals
          <View style={styles.stepContainer}>
            <View style={styles.header}>
              <Text style={styles.logo}>RawScan</Text>
            </View>
            <Text style={styles.stepTitle}>What would you like to accomplish?</Text>
            <Text style={styles.stepSubtitle}>
              Select all that resonate with your journey
            </Text>
            <Text style={styles.infoText}>
              Note: These goals are stored but excluded from personalized scoring by design.
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
        ) : step === 6 ? (
          // Sign Up Now Screen
          <View style={styles.stepContainer}>
            <View style={styles.header}>
              <Text style={styles.logo}>RawScan</Text>
            </View>
            <Text style={styles.stepTitle}>Sign Up Now</Text>
            <Text style={styles.stepSubtitle}>
              Create your account to start your personalized health journey
            </Text>
            
            <View style={styles.authContainer}>
              <TouchableOpacity
                style={[styles.googleButton, loading && styles.authButtonDisabled]}
                onPress={handleGoogleAuth}
                disabled={loading}
                testID="googleAuthButton"
              >
                <View style={styles.googleLogo}>
                  <Text style={styles.googleLogoText}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>
                  {loading ? 'Connecting...' : 'Continue with Google'}
                </Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.inputContainer}>
                <Mail size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.authInput}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                  testID="emailInput"
                />
              </View>

              <TouchableOpacity
                style={[styles.emailAuthButton, loading && styles.authButtonDisabled]}
                onPress={handleEmailAuth}
                disabled={loading}
                testID="emailAuthButton"
              >
                <Text style={styles.emailAuthButtonText}>
                  {loading ? 'Creating Account...' : 'Sign Up Now'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : step === 7 ? (
          // Free Trial Screen
          <View style={styles.stepContainer}>
            <View style={styles.header}>
              <Text style={styles.logo}>RawScan</Text>
            </View>
            <Text style={styles.stepTitle}>We want you to try RawScan for free</Text>
            <Text style={styles.stepSubtitle}>
              Experience all features with no commitment
            </Text>
            
            <View style={styles.trialContainer}>
              <View style={styles.trialCard}>
                <Star size={48} color="#FFD700" style={styles.trialIcon} />
                <Text style={styles.trialTitle}>7-Day Free Trial</Text>
                <Text style={styles.trialDescription}>
                  Full access to all RawScan features including unlimited scans, personalized recommendations, and health insights.
                </Text>
              </View>
              
              <Text style={styles.noCommitmentText}>No commitment - cancel anytime</Text>
              
              <TouchableOpacity
                style={styles.tryFreeButton}
                onPress={() => setStep(8)}
              >
                <Text style={styles.tryFreeButtonText}>Try for $0.00</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : step === 8 ? (
          // Trial Reminder Screen
          <View style={styles.stepContainer}>
            <View style={styles.header}>
              <Text style={styles.logo}>RawScan</Text>
            </View>
            <Text style={styles.stepTitle}>We&apos;ll send you a reminder</Text>
            <Text style={styles.stepSubtitle}>
              When your trial&apos;s about to end
            </Text>
            
            <View style={styles.reminderContainer}>
              <View style={styles.reminderCard}>
                <Mail size={48} color="#FF0040" style={styles.reminderIcon} />
                <Text style={styles.reminderTitle}>Email Reminder</Text>
                <Text style={styles.reminderDescription}>
                  We&apos;ll email you 2 days before your trial ends so you can decide if you want to continue with RawScan.
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.continueTrialButton}
                onPress={() => setStep(9)}
              >
                <Text style={styles.continueTrialButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Subscription Plans Screen
          <View style={styles.stepContainer}>
            <View style={styles.header}>
              <Text style={styles.logo}>RawScan</Text>
            </View>
            <Text style={styles.stepTitle}>Unlock RawScan</Text>
            <Text style={styles.stepSubtitle}>
              Know what&apos;s in your groceries and meet your goals
            </Text>
            
            <View style={styles.plansContainer}>
              <TouchableOpacity style={styles.planCard}>
                <View style={styles.planHeader}>
                  <Crown size={24} color="#FFD700" />
                  <Text style={styles.planType}>Weekly</Text>
                </View>
                <Text style={styles.planPrice}>$5.99</Text>
                <Text style={styles.planPeriod}>per week</Text>
                <Text style={styles.planDescription}>Perfect for trying out all features</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.planCard, styles.popularPlan]}>
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Most Popular</Text>
                </View>
                <View style={styles.planHeader}>
                  <Star size={24} color="#FF0040" />
                  <Text style={styles.planType}>Monthly</Text>
                </View>
                <Text style={styles.planPrice}>$15.00</Text>
                <Text style={styles.planPeriod}>per month</Text>
                <Text style={styles.planDescription}>Best value for regular users</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.selectPlanButton}
              onPress={handleComplete}
            >
              <Text style={styles.selectPlanButtonText}>Start Free Trial</Text>
            </TouchableOpacity>
          </View>
        )}

        {step >= 1 && step <= 6 && (
          <View style={styles.footer}>
            {step > 1 && step <= 5 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setStep(step - 1)}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            
            {step < 6 && (
              <TouchableOpacity
                style={[styles.continueButton, !canProceed() && styles.continueButtonDisabled]}
                onPress={() => setStep(step + 1)}
                disabled={!canProceed()}
                testID="continue-button"
              >
                <Text style={styles.continueButtonText}>Continue</Text>
                <ChevronRight size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        )}
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
  signupContainer: {
    flex: 1,
    justifyContent: "space-between",
    minHeight: "100%" as any,
  },
  header: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: "800" as const,
    color: "#FF0040",
    marginBottom: 8,
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#333333",
    textAlign: "center",
    marginBottom: 60,
    lineHeight: 40,
  },
  getStartedButton: {
    backgroundColor: "#FF0040",
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 30,
    marginBottom: 32,
    minWidth: 200,
    alignItems: "center",
  },
  getStartedButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700" as const,
  },
  signInContainer: {
    paddingVertical: 12,
  },
  signInText: {
    color: "#666666",
    fontSize: 16,
    fontWeight: "500" as const,
    textAlign: "center",
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
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
    fontWeight: "600" as const,
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
    fontWeight: "600" as const,
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
    flexDirection: "row",
    gap: 12,
    marginTop: 32,
  },
  backButton: {
    backgroundColor: "#F8F8F8",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  backButtonText: {
    color: "#333333",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  continueButton: {
    flex: 1,
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
    fontWeight: "700" as const,
  },
  authContainer: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  inputIcon: {
    marginRight: 12,
  },
  authInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    padding: 4,
  },
  switchAuthButton: {
    alignItems: "center",
    padding: 8,
    marginTop: 8,
  },
  switchAuthText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500" as const,
  },
  trialContainer: {
    alignItems: "center",
    gap: 24,
  },
  trialCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    width: "100%",
  },
  trialIcon: {
    marginBottom: 16,
  },
  trialTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#333",
    marginBottom: 12,
  },
  trialDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  noCommitmentText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  tryFreeButton: {
    backgroundColor: "#FF0040",
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 30,
    minWidth: 200,
    alignItems: "center",
  },
  tryFreeButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700" as const,
  },
  reminderContainer: {
    alignItems: "center",
    gap: 32,
  },
  reminderCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    width: "100%",
  },
  reminderIcon: {
    marginBottom: 16,
  },
  reminderTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#333",
    marginBottom: 12,
  },
  reminderDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  continueTrialButton: {
    backgroundColor: "#FF0040",
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 30,
    minWidth: 200,
    alignItems: "center",
  },
  continueTrialButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700" as const,
  },
  plansContainer: {
    gap: 16,
    marginBottom: 32,
  },
  planCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    position: "relative",
  },
  popularPlan: {
    borderColor: "#FF0040",
    borderWidth: 2,
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    left: 20,
    backgroundColor: "#FF0040",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600" as const,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  planType: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#333",
  },
  planPrice: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: "#FF0040",
  },
  planPeriod: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: "#999",
  },
  selectPlanButton: {
    backgroundColor: "#FF0040",
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
  },
  selectPlanButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700" as const,
  },
  googleButton: {
    backgroundColor: "#4285F4",
    borderRadius: 12,
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  googleButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  googleButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#666",
    fontSize: 14,
  },
  emailAuthButton: {
    backgroundColor: "#FF0040",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  emailAuthButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
  googleLogo: {
    width: 24,
    height: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleLogoText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
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
    fontWeight: '500' as const,
  },
  infoText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center" as const,
    marginTop: 8,
    marginBottom: 16,
    fontStyle: "italic" as const,
  },
});