import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { supabase } from '../../../lib/supabase';

const profileSchema = z.object({
  body_goal: z.enum(['lose_weight', 'gain_weight', 'maintain_weight']).optional(),
  health_goals: z.array(z.enum(['low_sugar', 'high_protein', 'low_fat', 'keto', 'balanced'])).optional(),
  diet_goals: z.array(z.enum(['whole_foods', 'vegan', 'carnivore', 'gluten_free', 'vegetarian', 'balanced'])).optional(),
  lifestyle_goals: z.array(z.string()).optional().nullable(),
});

export const profileUpsertProcedure = publicProcedure
  .input(z.object({
    userId: z.string().optional(),
    profile: profileSchema
  }))
  .mutation(async ({ input }: { input: { userId?: string; profile: z.infer<typeof profileSchema> } }) => {
    console.log('Upserting user profile:', input);
    
    if (!input.userId) {
      console.log('No userId provided, skipping database save');
      return { success: true, message: 'Profile validated but not saved (no user ID)' };
    }
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: input.userId,
          body_goal: input.profile.body_goal || null,
          health_goals: input.profile.health_goals || null,
          diet_goals: input.profile.diet_goals || null,
          lifestyle_goals: input.profile.lifestyle_goals || null,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error upserting profile:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log('Profile upserted successfully');
      return { success: true, message: 'Profile updated successfully' };
      
    } catch (error) {
      console.error('Profile upsert error:', error);
      throw new Error('Failed to update profile');
    }
  });