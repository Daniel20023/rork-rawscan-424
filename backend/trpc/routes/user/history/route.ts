import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { supabase } from '../../../../../lib/supabase';

export const getScanHistoryProcedure = protectedProcedure
  .input(z.object({
    limit: z.number().optional().default(50),
    offset: z.number().optional().default(0),
  }))
  .query(async ({ ctx, input }) => {
    console.log('Getting scan history for user:', ctx.user.id);
    
    const { data: scans, error } = await supabase
      .from('product_scans')
      .select('*')
      .eq('user_id', ctx.user.id)
      .order('scanned_at', { ascending: false })
      .range(input.offset, input.offset + input.limit - 1);
    
    if (error) {
      console.error('Error fetching scan history:', error);
      throw new Error('Failed to fetch scan history');
    }
    
    return scans || [];
  });

export const addScanProcedure = protectedProcedure
  .input(z.object({
    barcode: z.string(),
    product_name: z.string().optional(),
    brand: z.string().optional(),
    category: z.string().optional(),
    health_score: z.number().optional(),
    safety_score: z.number().optional(),
    fit_score: z.number().optional(),
    nutrition_data: z.any().optional(),
    ingredients: z.any().optional(),
    scan_method: z.string().default('barcode'),
    location: z.string().optional(),
    notes: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    console.log('Adding scan for user:', ctx.user.id, input);
    
    const { data, error } = await supabase
      .from('product_scans')
      .insert({
        user_id: ctx.user.id,
        ...input,
        scanned_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding scan:', error);
      throw new Error('Failed to add scan');
    }
    
    return data;
  });

export const deleteScanProcedure = protectedProcedure
  .input(z.object({
    scanId: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    console.log('Deleting scan:', input.scanId, 'for user:', ctx.user.id);
    
    const { error } = await supabase
      .from('product_scans')
      .delete()
      .eq('id', input.scanId)
      .eq('user_id', ctx.user.id);
    
    if (error) {
      console.error('Error deleting scan:', error);
      throw new Error('Failed to delete scan');
    }
    
    return { success: true };
  });