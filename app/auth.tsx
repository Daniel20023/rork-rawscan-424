import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { testNetworkConnectivity } from '@/lib/supabase';

import { Mail } from 'lucide-react-native';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const { signInWithGoogle, sendOTP } = useAuth();

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        // Let the auth state change handler in index.tsx handle the redirect
        console.log('Google auth successful, auth state will handle redirect');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred');
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
      console.log('Starting email sign in for:', email);
      
      // Test network connectivity first
      console.log('Testing network connectivity...');
      const connectivityTest = await testNetworkConnectivity();
      if (!connectivityTest.success) {
        console.error('Network connectivity test failed:', connectivityTest.error);
        Alert.alert('Connection Error', connectivityTest.error || 'Unable to connect to the server. Please check your internet connection.');
        return;
      }
      console.log('Network connectivity test passed');
      
      const { error } = await sendOTP(email);

      if (error) {
        console.error('Email auth error:', error);
        console.error('Error type:', typeof error);
        console.error('Error constructor:', error.constructor?.name);
        
        // Try to extract meaningful error information
        let errorMessage = 'Failed to send verification code';
        let errorTitle = 'Error';
        
        if (error && typeof error === 'object') {
          if ('message' in error && typeof error.message === 'string') {
            errorMessage = error.message;
          }
          
          // Check for specific error types
          if (errorMessage.includes('User not found') || 
              errorMessage.includes('Account not found') ||
              errorMessage.includes('Invalid login credentials') || 
              errorMessage.includes('Email not confirmed') ||
              errorMessage.includes('user_not_found')) {
            errorTitle = 'Account Not Found';
            errorMessage = 'No account found with this email address. Please contact support to create an account.';
          }
        }
        
        console.error('Processed error message:', errorMessage);
        Alert.alert(errorTitle, errorMessage);
      } else {
        console.log('Email auth successful, navigating to OTP screen');
        // Navigate to OTP verification screen
        router.push({
          pathname: '/verify-otp',
          params: {
            email,
          },
        });
      }
    } catch (err) {
      console.error('Unexpected error in handleEmailAuth:', err);
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (err instanceof Error) {
        if (err.message.includes('Network request failed') || err.message.includes('fetch') || err.message.includes('network')) {
          errorMessage = 'Network connection failed. Please check your internet connection and try again.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your internet connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      Alert.alert('Connection Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={styles.title}>RawScan</Text>
              <Text style={styles.subtitle}>
                Welcome back
              </Text>
              <Text style={styles.description}>
                Sign in to continue your health journey
              </Text>
            </View>

            <View style={styles.form}>
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
                  {loading ? 'Connecting...' : 'Sign in with Google'}
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
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                  testID="emailInput"
                />
              </View>

              <TouchableOpacity
                style={[styles.authButton, loading && styles.authButtonDisabled]}
                onPress={handleEmailAuth}
                disabled={loading}
                testID="emailAuthButton"
              >
                <Text style={styles.authButtonText}>
                  {loading ? 'Sending Code...' : 'Send Sign In Code'}
                </Text>
              </TouchableOpacity>

              <View style={styles.helpText}>
                <Text style={styles.helpTextContent}>
                  Don&apos;t have an account? Contact support to get started.
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF0040',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#333333',
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  googleButton: {
    backgroundColor: '#4285F4',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
    fontWeight: 'bold',
  },
  googleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  authButton: {
    backgroundColor: '#FF0040',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    alignItems: 'center',
    padding: 8,
  },
  helpTextContent: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});