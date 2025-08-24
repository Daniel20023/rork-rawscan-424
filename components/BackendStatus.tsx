import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { trpcClient } from '@/lib/trpc';
import { Wifi, WifiOff, CheckCircle } from 'lucide-react-native';

type BackendStatusType = 'checking' | 'connected' | 'disconnected' | 'error';

interface BackendStatusProps {
  showDetails?: boolean;
}

export function BackendStatus({ showDetails = false }: BackendStatusProps) {
  const [status, setStatus] = useState<BackendStatusType>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const checkBackendStatus = async () => {
    setStatus('checking');
    setErrorMessage('');
    
    try {
      console.log('🔍 Checking backend status...');
      
      // Test basic connectivity first
      const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'https://awroo30hww4zvdjwpwrgm.rork.com';
      
      const healthResponse = await fetch(`${baseUrl}/api/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });
      
      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.status} ${healthResponse.statusText}`);
      }
      
      // Test tRPC endpoint
      const result = await trpcClient.example.hi.query();
      
      if (result?.hello) {
        setStatus('connected');
        console.log('✅ Backend is connected and working');
      } else {
        throw new Error('tRPC returned unexpected response');
      }
      
    } catch (error) {
      console.error('❌ Backend status check failed:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
    
    setLastCheck(new Date());
  };

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <CheckCircle size={20} color="#10B981" />;
      case 'disconnected':
      case 'error':
        return <WifiOff size={20} color="#EF4444" />;
      case 'checking':
      default:
        return <Wifi size={20} color="#F59E0B" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Backend Connected';
      case 'disconnected':
        return 'Backend Disconnected';
      case 'error':
        return 'Backend Error';
      case 'checking':
      default:
        return 'Checking Backend...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return '#10B981';
      case 'disconnected':
      case 'error':
        return '#EF4444';
      case 'checking':
      default:
        return '#F59E0B';
    }
  };

  const handleStatusPress = () => {
    if (status === 'error' && errorMessage) {
      Alert.alert(
        'Backend Error Details',
        errorMessage,
        [
          { text: 'Retry', onPress: checkBackendStatus },
          { text: 'OK', style: 'cancel' }
        ]
      );
    } else {
      checkBackendStatus();
    }
  };

  if (!showDetails) {
    return (
      <TouchableOpacity style={styles.compactContainer} onPress={handleStatusPress}>
        {getStatusIcon()}
        <Text style={[styles.compactText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.statusRow} onPress={handleStatusPress}>
        {getStatusIcon()}
        <View style={styles.statusInfo}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
          {lastCheck && (
            <Text style={styles.lastCheckText}>
              Last checked: {lastCheck.toLocaleTimeString()}
            </Text>
          )}
          {status === 'error' && errorMessage && (
            <Text style={styles.errorText} numberOfLines={2}>
              {errorMessage}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.retryButton} onPress={checkBackendStatus}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusInfo: {
    marginLeft: 12,
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  compactText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  lastCheckText: {
    fontSize: 12,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});