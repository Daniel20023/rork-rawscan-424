import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { supabase } from '../../../../../lib/supabase';

export const getFavoritesProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    console.log('Getting favorites for user:', ctx.user.id);
    
    const { data: favorites, error } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching favorites:', error);
      throw new Error('Failed to fetch favorites');
    }
    
    return favorites || [];
  });

export const addFavoriteProcedure = protectedProcedure
  .input(z.object({
    barcode: z.string(),
    product_name: z.string().optional(),
    brand: z.string().optional(),
    category: z.string().optional(),
    health_score: z.number().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    console.log('Adding favorite for user:', ctx.user.id, input);
    
    const { data, error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: ctx.user.id,
        ...input,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding favorite:', error);
      throw new Error('Failed to add favorite');
    }
    
    return data;
  });

export const removeFavoriteProcedure = protectedProcedure
  .input(z.object({
    favoriteId: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    console.log('Removing favorite:', input.favoriteId, 'for user:', ctx.user.id);
    
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('id', input.favoriteId)
      .eq('user_id', ctx.user.id);
    
    if (error) {
      console.error('Error removing favorite:', error);
      throw new Error('Failed to remove favorite');
    }
    
    return { success: true };
  });

export const toggleFavoriteProcedure = protectedProcedure
  .input(z.object({
    barcode: z.string(),
    product_name: z.string().optional(),
    brand: z.string().optional(),
    category: z.string().optional(),
    health_score: z.number().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    console.log('Toggling favorite for user:', ctx.user.id, input.barcode);
    
    // Check if already favorited
    const { data: existing } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', ctx.user.id)
      .eq('barcode', input.barcode)
      .single();
    
    if (existing) {
      // Remove from favorites
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', existing.id);
      
      if (error) {
        console.error('Error removing favorite:', error);
        throw new Error('Failed to remove favorite');
      }
      
      return { favorited: false };
    } else {
      // Add to favorites
      const { data, error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: ctx.user.id,
          barcode: input.barcode,
          product_name: input.product_name,
          brand: input.brand,
          category: input.category,
          health_score: input.health_score,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error adding favorite:', error);
        throw new Error('Failed to add favorite');
      }
      
      return { favorited: true, data };
    }
  });