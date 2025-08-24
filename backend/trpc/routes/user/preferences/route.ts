import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { supabase } from '../../../../../lib/supabase';

export const getUserPreferencesProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    console.log('Getting preferences for user:', ctx.user.id);
    
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', ctx.user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching preferences:', error);
      throw new Error('Failed to fetch preferences');
    }
    
    return preferences;
  });

export const updateUserPreferencesProcedure = protectedProcedure
  .input(z.object({
    body_goal: z.string().optional(),
    health_goals: z.array(z.string()).optional(),
    diet_type: z.string().optional(),
    avoid_ingredients: z.array(z.string()).optional(),
    strictness: z.object({
      health: z.number(),
      safety: z.number(),
      fit: z.number(),
    }).optional(),
    accomplish_future: z.array(z.string()).optional(),
    display_name: z.string().optional(),
    gender: z.string().optional(),
    age: z.number().optional(),
    height_cm: z.number().optional(),
    weight_kg: z.number().optional(),
    activity_level: z.string().optional(),
    notifications_enabled: z.boolean().optional(),
    notification_preferences: z.object({
      scan_reminders: z.boolean(),
      health_insights: z.boolean(),
      goal_updates: z.boolean(),
    }).optional(),
    privacy_settings: z.object({
      share_data: z.boolean(),
      analytics: z.boolean(),
    }).optional(),
    onboarding_completed: z.boolean().optional(),
    onboarding_step: z.number().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    console.log('Updating preferences for user:', ctx.user.id, input);
    
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: ctx.user.id,
        ...input,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error updating preferences:', error);
      throw new Error('Failed to update preferences');
    }
    
    return data;
  });