import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { testBackendConnection, trpcClient } from '@/lib/trpc';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react-native';

type TestResult = {
  name: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  duration?: number;
};

export default function BackendTestPage() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Backend Health Check', status: 'pending' },
    { name: 'tRPC Connection', status: 'pending' },
    { name: 'Example Route', status: 'pending' },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (index: number, update: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => i === index ? { ...test, ...update } : test));
  };

  const runTests = async () => {
    setIsRunning(true);
    
    // Reset all tests
    setTests(prev => prev.map(test => ({ ...test, status: 'pending' as const, message: undefined, duration: undefined })));

    const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'http://localhost:3000';
    
    // Test 1: Backend Health Check
    try {
      const start = Date.now();
      const result = await testBackendConnection(baseUrl);
      const duration = Date.now() - start;
      
      if (result.ok) {
        updateTest(0, { 
          status: 'success', 
          message: `Backend is healthy (${duration}ms)`,
          duration 
        });
      } else {
        updateTest(0, { 
          status: 'error', 
          message: result.error || 'Unknown error',
          duration 
        });
      }
    } catch (error) {
      updateTest(0, { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    // Test 2: tRPC Connection
    try {
      const start = Date.now();
      const response = await fetch(`${baseUrl}/api/trpc`);
      const duration = Date.now() - start;
      
      if (response.ok) {
        updateTest(1, { 
          status: 'success', 
          message: `tRPC endpoint accessible (${duration}ms)`,
          duration 
        });
      } else {
        updateTest(1, { 
          status: 'error', 
          message: `tRPC endpoint returned ${response.status}: ${response.statusText}`,
          duration 
        });
      }
    } catch (error) {
      updateTest(1, { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    // Test 3: Example Route
    try {
      const start = Date.now();
      const result = await trpcClient.example.hi.query();
      const duration = Date.now() - start;
      
      if (result && result.hello) {
        updateTest(2, { 
          status: 'success', 
          message: `Example route working: "${result.hello}" (${duration}ms)`,
          duration 
        });
      } else {
        updateTest(2, { 
          status: 'error', 
          message: 'Example route returned unexpected response' 
        });
      }
    } catch (error) {
      updateTest(2, { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={20} color="#10B981" />;
      case 'error':
        return <XCircle size={20} color="#EF4444" />;
      case 'pending':
      default:
        return <Clock size={20} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'pending':
      default:
        return '#6B7280';
    }
  };

  const showDetails = () => {
    const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'http://localhost:3000';
    Alert.alert(
      'Backend Configuration',
      `Backend URL: ${baseUrl}\n\nThis page tests the connection to your backend server. If tests are failing, make sure to run the backend server with:\n\nbun run backend/server.ts`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Backend Connection Test</Text>
          <Text style={styles.subtitle}>
            Testing connection to: {process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'http://localhost:3000'}
          </Text>
        </View>

        <View style={styles.testsContainer}>
          {tests.map((test, index) => (
            <View key={index} style={styles.testItem}>
              <View style={styles.testHeader}>
                {getStatusIcon(test.status)}
                <Text style={[styles.testName, { color: getStatusColor(test.status) }]}>
                  {test.name}
                </Text>
              </View>
              {test.message && (
                <Text style={styles.testMessage}>{test.message}</Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={runTests}
            disabled={isRunning}
          >
            <RefreshCw size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>
              {isRunning ? 'Running Tests...' : 'Run Tests'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={showDetails}
          >
            <Text style={styles.secondaryButtonText}>Show Details</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Troubleshooting:</Text>
          <Text style={styles.instructionsText}>
            • If all tests fail: Backend is not deployed or URL is incorrect{"\n"}
            • If health check fails: Backend server is down{"\n"}
            • If tRPC fails: tRPC router configuration issue{"\n"}
            • If example route fails: Route implementation issue
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  testsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  testItem: {
    marginBottom: 16,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  testMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 32,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
    marginBottom: 30,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
});