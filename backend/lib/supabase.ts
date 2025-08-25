import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xgcgrcnznpfvybaptniz.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY2dyY256bnBmdnliYXB0bml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzE4NjUsImV4cCI6MjA3MTUwNzg2NX0.sixa0tci58dkeO20y6kldfzGaYkPYYMghiJpl6ce0Mo';

// Validate URLs
if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseUrl === 'https://your-project-id.supabase.co') {
  throw new Error('Missing or invalid EXPO_PUBLIC_SUPABASE_URL');
}
if (!supabaseServiceKey || supabaseServiceKey === 'YOUR_SUPABASE_ANON_KEY' || supabaseServiceKey === 'your-anon-key-here') {
  throw new Error('Missing or invalid SUPABASE_SERVICE_ROLE_KEY');
}

console.log('Backend Supabase URL:', supabaseUrl);
console.log('Backend Supabase Key exists:', !!supabaseServiceKey);

// Create backend-specific Supabase client (no React Native dependencies)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'backend-server',
    },
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          body_goal: string | null;
          health_goals: string[] | null;
          diet_goals: string[] | null;
          lifestyle_goals: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          body_goal?: string | null;
          health_goals?: string[] | null;
          diet_goals?: string[] | null;
          lifestyle_goals?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          body_goal?: string | null;
          health_goals?: string[] | null;
          diet_goals?: string[] | null;
          lifestyle_goals?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      items: {
        Row: {
          id: string;
          barcode: string | null;
          name: string;
          brand: string | null;
          category: string;
          ingredients: string;
          nutrition: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          barcode?: string | null;
          name: string;
          brand?: string | null;
          category: string;
          ingredients: string;
          nutrition?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          barcode?: string | null;
          name?: string;
          brand?: string | null;
          category?: string;
          ingredients?: string;
          nutrition?: any | null;
          created_at?: string;
        };
      };
      rules_catalog: {
        Row: {
          id: number;
          type: string;
          target: string;
          pattern: string;
          weight: number;
          category: string;
          notes: string | null;
        };
        Insert: {
          id?: number;
          type: string;
          target: string;
          pattern: string;
          weight: number;
          category: string;
          notes?: string | null;
        };
        Update: {
          id?: number;
          type?: string;
          target?: string;
          pattern?: string;
          weight?: number;
          category?: string;
          notes?: string | null;
        };
      };
      scores: {
        Row: {
          id: string;
          user_id: string | null;
          item_id: string;
          rules_score: number;
          personalized_score: number;
          explanation: any;
          swaps: any | null;
          details: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          item_id: string;
          rules_score: number;
          personalized_score: number;
          explanation: any;
          swaps?: any | null;
          details?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          item_id?: string;
          rules_score?: number;
          personalized_score?: number;
          explanation?: any;
          swaps?: any | null;
          details?: any | null;
          created_at?: string;
        };
      };
    };
  };
};