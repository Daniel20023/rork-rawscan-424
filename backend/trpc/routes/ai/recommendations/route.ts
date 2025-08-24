import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { AIService } from '../../../../services/AIService';

export const recommendationsProcedure = publicProcedure
  .input(z.object({
    product: z.object({
      barcode: z.string(),
      name: z.string(),
      brand: z.string().optional(),
      ingredientsText: z.string().optional(),
      nutriments: z.object({
        energyKcal: z.number().optional(),
        protein: z.number().optional(),
        carbohydrates: z.number().optional(),
        fat: z.number().optional(),
        sugars: z.number().optional(),
        fiber: z.number().optional(),
        sodium: z.number().optional()
      }),
      source: z.enum(['off', 'fdc', 'nutritionix'])
    }),
    userPreferences: z.object({
      diet_type: z.string().optional(),
      health_goals: z.array(z.string()).optional(),
      body_goal: z.string().optional()
    }),
    score: z.number()
  }))
  .mutation(async ({ input }) => {
    console.log('Generating recommendations for:', input.product.name, 'Score:', input.score);
    
    const result = await AIService.generateProductRecommendations(
      input.product as any,
      input.userPreferences,
      input.score
    );
    
    console.log('Recommendations generated:', result.alternatives.length, 'alternatives');
    
    return result;
  });