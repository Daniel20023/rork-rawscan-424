import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Mail } from 'lucide-react-native';

export default function VerifyOTPScreen() {
  const { email, preferences } = useLocalSearchParams<{ email: string; preferences?: string }>();
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  
  const { verifyOTP, sendOTP } = useAuth();

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedCode.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      
      // Focus last filled input or next empty one
      const nextIndex = Math.min(pastedCode.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    if (!email) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    setLoading(true);
    try {
      // Parse preferences if they exist
      let userPreferences = null;
      if (preferences) {
        try {
          userPreferences = JSON.parse(preferences);
          console.log('Parsed user preferences from questionnaire:', userPreferences);
          console.log('User goals summary:', {
            name: userPreferences.name,
            gender: userPreferences.gender,
            bodyGoals: userPreferences.bodyGoals,
            healthGoals: userPreferences.healthGoals,
            dietGoals: userPreferences.dietGoals,
            accomplishmentGoals: userPreferences.accomplishmentGoals
          });
        } catch (err) {
          console.error('Error parsing preferences:', err);
        }
      } else {
        console.log('No preferences found in OTP verification');
      }

      const { error } = await verifyOTP(email, otpCode, userPreferences);
      if (error) {
        Alert.alert('Error', error.message);
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        console.log('OTP verification successful, user goals have been logged and saved');
        console.log('Auth state will handle redirect to appropriate screen');
        // Let the auth state change handler in index.tsx handle the redirect
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) return;
    
    setResendLoading(true);
    try {
      const { error } = await sendOTP(email);
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'A new verification code has been sent to your email');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      Alert.alert('Error', 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Mail size={48} color="#FF0040" />
          </View>
          
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We&apos;ve sent a 6-digit verification code to
          </Text>
          <Text style={styles.email}>{email}</Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.otpInput,
                  digit ? styles.otpInputFilled : null,
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="numeric"
                maxLength={6} // Allow paste
                textAlign="center"
                selectTextOnFocus
                testID={`otpInput${index}`}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.verifyButton,
              (loading || otp.join('').length !== 6) && styles.verifyButtonDisabled,
            ]}
            onPress={handleVerify}
            disabled={loading || otp.join('').length !== 6}
            testID="verifyButton"
          >
            <Text style={styles.verifyButtonText}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </Text>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn&apos;t receive the code? </Text>
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={resendLoading}
              testID="resendButton"
            >
              <Text style={styles.resendLink}>
                {resendLoading ? 'Sending...' : 'Resend'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#FF0040',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 40,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
    gap: 8,
  },
  otpInput: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  otpInputFilled: {
    borderColor: '#FF0040',
    backgroundColor: '#FFF0F3',
  },
  verifyButton: {
    backgroundColor: '#FF0040',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    minWidth: 200,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendLink: {
    fontSize: 14,
    color: '#FF0040',
    fontWeight: '600',
  },
});