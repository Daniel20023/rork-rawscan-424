import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { supabase } from '../../../../../lib/supabase';

export const getProfileProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    console.log('Getting profile for user:', ctx.user.id);
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', ctx.user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      throw new Error('Failed to fetch profile');
    }
    
    return profile;
  });

export const updateProfileProcedure = protectedProcedure
  .input(z.object({
    full_name: z.string().optional(),
    avatar_url: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    console.log('Updating profile for user:', ctx.user.id, input);
    
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: ctx.user.id,
        email: ctx.user.email || '',
        ...input,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
    
    return data;
  });