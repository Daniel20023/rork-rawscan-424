import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xgcgrcnznpfvybaptniz.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY2dyY256bnBmdnliYXB0bml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzE4NjUsImV4cCI6MjA3MTUwNzg2NX0.sixa0tci58dkeO20y6kldfzGaYkPYYMghiJpl6ce0Mo';

// Validate URLs
if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL') {
  throw new Error('Missing or invalid EXPO_PUBLIC_SUPABASE_URL');
}
if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  throw new Error('Missing or invalid EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);
console.log('Platform:', Platform.OS);

// Create storage adapter for React Native
const storage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': `expo-app/${Platform.OS}`,
    },
    fetch: (url, options = {}) => {
      console.log('Making request to:', url);
      
      // Add timeout to all requests with better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Request timeout for:', url);
        controller.abort();
      }, 15000); // 15 seconds timeout
      
      // Ensure API key is always included for Supabase requests
      const headers = {
        'Cache-Control': 'no-cache',
        'Accept': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        ...options.headers,
      };
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
        headers,
      }).then((response) => {
        console.log('Response for', url, ':', response.status, response.statusText);
        return response;
      }).catch((error) => {
        console.error('Fetch error for', url, ':', {
          message: error.message,
          name: error.name,
          stack: error.stack?.substring(0, 200)
        });
        throw error;
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// Test network connectivity
export const testNetworkConnectivity = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Testing network connectivity to Supabase...');
    
    // Test basic network connectivity first
    if (Platform.OS === 'web') {
      if (!navigator.onLine) {
        return { success: false, error: 'No internet connection detected' };
      }
    }
    
    // Test Supabase connection with proper REST API endpoint
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Supabase REST API returns 200 for valid requests, even if no tables
      if (response.ok || response.status === 401 || response.status === 404) {
        console.log('Supabase connection test successful, status:', response.status);
        return { success: true };
      } else {
        const responseText = await response.text();
        console.error('Supabase connection test failed:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText
        });
        return { success: false, error: `Connection failed with status ${response.status}: ${responseText}` };
      }
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown network error';
      console.error('Network connectivity test error:', errorMessage);
      
      if (errorMessage.includes('AbortError') || errorMessage.includes('timeout')) {
        return { success: false, error: 'Connection timeout - please check your internet connection' };
      }
      
      return { success: false, error: errorMessage };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown network error';
    console.error('Network connectivity test error:', {
      error: err,
      message: errorMessage
    });
    return { success: false, error: errorMessage };
  }
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_scans: {
        Row: {
          id: string;
          user_id: string;
          barcode: string;
          product_name: string | null;
          brand: string | null;
          category: string | null;
          health_score: number | null;
          safety_score: number | null;
          fit_score: number | null;
          nutrition_data: any | null;
          ingredients: any | null;
          scan_method: string;
          location: string | null;
          notes: string | null;
          scanned_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          barcode: string;
          product_name?: string | null;
          brand?: string | null;
          category?: string | null;
          health_score?: number | null;
          safety_score?: number | null;
          fit_score?: number | null;
          nutrition_data?: any | null;
          ingredients?: any | null;
          scan_method?: string;
          location?: string | null;
          notes?: string | null;
          scanned_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          barcode?: string;
          product_name?: string | null;
          brand?: string | null;
          category?: string | null;
          health_score?: number | null;
          safety_score?: number | null;
          fit_score?: number | null;
          nutrition_data?: any | null;
          ingredients?: any | null;
          scan_method?: string;
          location?: string | null;
          notes?: string | null;
          scanned_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_favorites: {
        Row: {
          id: string;
          user_id: string;
          barcode: string;
          product_name: string | null;
          brand: string | null;
          category: string | null;
          health_score: number | null;
          notes: string | null;
          tags: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          barcode: string;
          product_name?: string | null;
          brand?: string | null;
          category?: string | null;
          health_score?: number | null;
          notes?: string | null;
          tags?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          barcode?: string;
          product_name?: string | null;
          brand?: string | null;
          category?: string | null;
          health_score?: number | null;
          notes?: string | null;
          tags?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          body_goal: string;
          health_goals: any;
          diet_type: string;
          avoid_ingredients: any;
          strictness: any;
          accomplish_future: any;
          display_name: string | null;
          gender: string | null;
          age: number | null;
          height_cm: number | null;
          weight_kg: number | null;
          activity_level: string | null;
          notifications_enabled: boolean;
          notification_preferences: any;
          privacy_settings: any;
          onboarding_completed: boolean;
          onboarding_step: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          body_goal?: string;
          health_goals?: any;
          diet_type?: string;
          avoid_ingredients?: any;
          strictness?: any;
          accomplish_future?: any;
          display_name?: string | null;
          gender?: string | null;
          age?: number | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          activity_level?: string | null;
          notifications_enabled?: boolean;
          notification_preferences?: any;
          privacy_settings?: any;
          onboarding_completed?: boolean;
          onboarding_step?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          body_goal?: string;
          health_goals?: any;
          diet_type?: string;
          avoid_ingredients?: any;
          strictness?: any;
          accomplish_future?: any;
          display_name?: string | null;
          gender?: string | null;
          age?: number | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          activity_level?: string | null;
          notifications_enabled?: boolean;
          notification_preferences?: any;
          privacy_settings?: any;
          onboarding_completed?: boolean;
          onboarding_step?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_goals: {
        Row: {
          id: string;
          user_id: string;
          goal_type: string;
          goal_value: number;
          current_value: number;
          unit: string | null;
          target_date: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          goal_type: string;
          goal_value: number;
          current_value?: number;
          unit?: string | null;
          target_date?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          goal_type?: string;
          goal_value?: number;
          current_value?: number;
          unit?: string | null;
          target_date?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_type: string;
          achievement_name: string;
          description: string | null;
          points: number;
          badge_icon: string | null;
          unlocked_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_type: string;
          achievement_name: string;
          description?: string | null;
          points?: number;
          badge_icon?: string | null;
          unlocked_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_type?: string;
          achievement_name?: string;
          description?: string | null;
          points?: number;
          badge_icon?: string | null;
          unlocked_at?: string;
          created_at?: string;
        };
      };
      user_activity_log: {
        Row: {
          id: string;
          user_id: string;
          activity_type: string;
          activity_data: any | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: string;
          activity_data?: any | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type?: string;
          activity_data?: any | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      user_insights: {
        Row: {
          id: string;
          user_id: string;
          insight_type: string;
          insight_data: any;
          period_start: string | null;
          period_end: string | null;
          generated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          insight_type: string;
          insight_data: any;
          period_start?: string | null;
          period_end?: string | null;
          generated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          insight_type?: string;
          insight_data?: any;
          period_start?: string | null;
          period_end?: string | null;
          generated_at?: string;
          created_at?: string;
        };
      };
    };
  };
};