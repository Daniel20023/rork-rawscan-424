import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { AIService } from '../../../../services/AIService';

export const analyzeIngredientsProcedure = publicProcedure
  .input(z.object({
    ingredients: z.array(z.string()),
    userPreferences: z.object({
      diet_type: z.string().optional(),
      health_goals: z.array(z.string()).optional(),
      avoid_ingredients: z.array(z.string()).optional()
    })
  }))
  .mutation(async ({ input }) => {
    console.log('Analyzing ingredients:', input.ingredients.length, 'items');
    
    const result = await AIService.analyzeIngredients(input.ingredients, input.userPreferences);
    
    console.log('Ingredient analysis complete:', result.harmful.length, 'harmful,', result.beneficial.length, 'beneficial');
    
    return result;
  });