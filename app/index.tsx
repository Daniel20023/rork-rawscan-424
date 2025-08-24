import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { Scan, Settings } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function IndexScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const { user, session, loading: authLoading } = useAuth();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      console.log('Checking authentication status...');
      console.log('Auth loading:', authLoading);
      console.log('User:', user?.email);
      console.log('Session:', !!session);
      
      // Wait for auth to finish loading
      if (authLoading) {
        console.log('Auth still loading, waiting...');
        return;
      }
      
      // If user is authenticated, redirect to main app
      if (user && session) {
        console.log('User is authenticated, checking onboarding status...');
        
        try {
          // Check if user has completed onboarding
          const STORAGE_KEY = "rawscan_user_preferences";
          const storedPreferences = await AsyncStorage.getItem(STORAGE_KEY);
          
          if (storedPreferences) {
            const preferences = JSON.parse(storedPreferences);
            console.log('User preferences found:', preferences);
            
            if (preferences.hasCompletedOnboarding) {
              console.log('User has completed onboarding, redirecting to scanner...');
              router.replace('/(tabs)/(scanner)/scan');
              return;
            } else {
              console.log('User has not completed onboarding, redirecting to onboarding...');
              router.replace('/onboarding');
              return;
            }
          } else {
            console.log('No user preferences found, redirecting to onboarding...');
            router.replace('/onboarding');
            return;
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          // If there's an error, redirect to onboarding to be safe
          router.replace('/onboarding');
          return;
        }
      }
      
      // If not authenticated, show welcome screen after a brief delay
      console.log('User not authenticated, showing welcome screen...');
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    };
    
    checkAuthAndRedirect();
  }, [user, session, authLoading]);

  const handleGetStarted = () => {
    console.log('Get started pressed');
    router.push("/onboarding");
  };

  const handleSignIn = () => {
    console.log('Sign in pressed');
    router.push("/auth");
  };

  const handleBackendTest = () => {
    console.log('Backend test pressed');
    router.push("/backend-test");
  };

  // Show loading initially
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF0040" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show welcome screen
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gradient}>
        {/* Hero section */}
        <View style={styles.heroContainer}>
          <View style={styles.heroIcon}>
            <Scan size={80} color="#FF0040" />
          </View>
        </View>
        
        {/* Main content */}
        <View style={styles.mainContent}>
          <Text style={styles.mainTitle}>Health tracking{"\n"}made easy</Text>
          
          <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
            <Text style={styles.getStartedButtonText}>Get Started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.signInContainer} onPress={handleSignIn}>
            <Text style={styles.signInText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.debugButton} onPress={handleBackendTest}>
            <Settings size={16} color="#6B7280" />
            <Text style={styles.debugButtonText}>Backend Test</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  gradient: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  heroContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 40,
  },
  heroIcon: {
    width: 160,
    height: 160,
    backgroundColor: "#FFFFFF",
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF0040",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 3,
    borderColor: "#FF0040",
  },

  mainContent: {
    paddingHorizontal: 32,
    paddingBottom: 50,
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: "800" as const,
    color: "#333333",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 50,
  },
  getStartedButton: {
    backgroundColor: "#FF0040",
    paddingHorizontal: 60,
    paddingVertical: 18,
    borderRadius: 30,
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
    shadowColor: "#FF0040",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600" as const,
  },
  signInContainer: {
    paddingVertical: 12,
  },
  signInText: {
    color: "#FF0040",
    fontSize: 16,
    fontWeight: "500" as const,
    textAlign: "center",
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 8,
  },
  debugButtonText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "500" as const,
  },
});