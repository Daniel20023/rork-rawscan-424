import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { AIService } from '../../../../services/AIService';
import { scoreItem } from '../../../../services/ScoringService';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const analyzeProductSchema = z.object({
  barcode: z.string().optional(),
  name: z.string(),
  brand: z.string().optional(),
  category: z.enum(['food', 'skincare', 'supplement']),
  ingredients: z.string(),
  nutrition: z.object({
    calories: z.number().optional(),
    sugar_g: z.number().optional(),
    added_sugar_g: z.number().optional(),
    sodium_mg: z.number().optional(),
    fiber_g: z.number().optional(),
    protein_g: z.number().optional(),
    sat_fat_g: z.number().optional(),
    net_carbs_g: z.number().optional(),
  }).optional(),
  userId: z.string().optional(),
});

export const analyzeProductProcedure = publicProcedure
  .input(analyzeProductSchema)
  .mutation(async ({ input }) => {
    console.log('🔍 Analyzing product with AI:', input.name);
    
    try {
      // Get user profile if userId provided
      let profile = {
        body_goal: 'maintain_weight' as const,
        health_goals: ['balanced' as const],
        diet_goals: ['balanced' as const],
        lifestyle_goals: null as string[] | null,
      };
      
      if (input.userId) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', input.userId)
          .single();
          
        if (userProfile) {
          profile = {
            body_goal: userProfile.body_goal || 'maintain_weight',
            health_goals: userProfile.health_goals || ['balanced'],
            diet_goals: userProfile.diet_goals || ['balanced'],
            lifestyle_goals: userProfile.lifestyle_goals,
          };
        }
      }
      
      // Create item input for scoring
      const itemInput = {
        category: input.category,
        ingredients: input.ingredients,
        nutrition: input.nutrition,
      };
      
      // Calculate score using rules engine
      const scoreResult = await scoreItem(itemInput, profile);
      console.log('📊 Scoring result:', scoreResult);
      
      // Generate AI explanation
      const aiExplanation = await AIService.generateExplanation(
        profile,
        itemInput,
        scoreResult
      );
      
      // Store the item and score in database
      const { data: item } = await supabase
        .from('items')
        .upsert({
          barcode: input.barcode,
          name: input.name,
          brand: input.brand,
          category: input.category,
          ingredients: input.ingredients,
          nutrition: input.nutrition,
        })
        .select()
        .single();
      
      if (item) {
        await supabase
          .from('scores')
          .insert({
            user_id: input.userId || null,
            item_id: item.id,
            rules_score: scoreResult.rules_score,
            personalized_score: scoreResult.personalized_score,
            explanation: aiExplanation,
            details: {
              matchedFacts: scoreResult.matchedFacts,
              appliedMultipliers: scoreResult.appliedMultipliers,
            },
          });
      }
      
      return {
        success: true,
        score: {
          rules: scoreResult.rules_score,
          personalized: scoreResult.personalized_score,
          verdict: aiExplanation.verdict,
        },
        headline: aiExplanation.headline,
        why: aiExplanation.why,
        swaps: aiExplanation.swaps,
        details: {
          matchedFacts: scoreResult.matchedFacts,
          appliedMultipliers: scoreResult.appliedMultipliers,
        },
        disclaimer: aiExplanation.disclaimer,
      };
      
    } catch (error) {
      console.error('❌ Product analysis failed:', error);
      throw new Error('Failed to analyze product');
    }
  });