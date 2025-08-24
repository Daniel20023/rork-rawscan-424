import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { AIService } from '../../../../services/AIService';

export const ocrProcedure = publicProcedure
  .input(z.object({
    imageBase64: z.string()
  }))
  .mutation(async ({ input }) => {
    console.log('Processing OCR request for nutrition label');
    
    const result = await AIService.extractNutritionFromImage(input.imageBase64);
    
    console.log('OCR result:', result.success ? 'Success' : `Failed: ${result.error}`);
    
    return result;
  });