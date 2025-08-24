import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { AIService } from '../../../../services/AIService';

export const nutritionInsightsProcedure = publicProcedure
  .input(z.object({
    product: z.object({
      barcode: z.string(),
      name: z.string(),
      brand: z.string().optional(),
      ingredientsText: z.string().optional(),
      nutritionBasis: z.enum(['per_serving', 'per_100g']).optional(),
      nutriments: z.object({
        energyKcal: z.number().optional(),
        protein: z.number().optional(),
        carbohydrates: z.number().optional(),
        fat: z.number().optional(),
        sugars: z.number().optional(),
        fiber: z.number().optional(),
        sodium: z.number().optional()
      }),
      source: z.enum(['off', 'local', 'usda'])
    }),
    score: z.number(),
    userPreferences: z.object({
      diet_type: z.string().optional(),
      health_goals: z.array(z.string()).optional(),
      body_goal: z.string().optional()
    })
  }))
  .mutation(async ({ input }) => {
    console.log('Generating nutrition insights for:', input.product.name);
    
    const result = await AIService.generateNutritionInsights(
      input.product as any,
      input.score,
      input.userPreferences
    );
    
    console.log('Nutrition insights generated');
    
    return result;
  });