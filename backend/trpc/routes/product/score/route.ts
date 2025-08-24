import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { ProductService } from "../../../../services/ProductService";
import { scoreProductPersonalized } from '@/utils/scoring';

// User profile schema for scoring
const UserProfileSchema = z.object({
  user_id: z.string(),
  body_goal: z.enum(['lose_weight', 'gain_weight', 'maintain_weight']),
  health_goals: z.array(z.enum(['low_sugar', 'high_protein', 'low_fat', 'keto', 'balanced'])),
  diet_type: z.enum(['whole_foods', 'vegan', 'carnivore', 'gluten_free', 'vegetarian', 'balanced']),
  avoid_ingredients: z.array(z.enum(['seed_oils', 'artificial_colors'])).optional(),
  strictness: z.object({
    diet_type: z.number().min(0).max(1),
    health_goals: z.number().min(0).max(1)
  }),
  accomplish_future: z.array(z.enum([
    'eat_and_live_healthier',
    'boost_energy_and_mood', 
    'feel_better_about_my_body',
    'clear_up_my_skin'
  ]))
});

export const scoreProcedure = publicProcedure
  .input(
    z.object({
      barcode: z.string().min(1, "Barcode is required"),
      userProfile: UserProfileSchema
    })
  )
  .query(async ({ input }: { input: { barcode: string; userProfile: any } }) => {
    const { barcode, userProfile } = input;
    
    console.log(`🎯 Generating personalized score v1.1 for barcode: ${barcode}`, {
      userId: userProfile.user_id,
      bodyGoal: userProfile.body_goal,
      healthGoals: userProfile.health_goals,
      dietType: userProfile.diet_type,
      avoidIngredients: userProfile.avoid_ingredients
    });
    
    // Get product data
    const result = await ProductService.getProduct(barcode);
    
    if (!result.ok || !result.product) {
      throw new Error(result.error || 'Product not found');
    }
    
    // Generate personalized score using v1.1 (allergen-free)
    try {
      const scoringResult = scoreProductPersonalized(result.product, userProfile);
      
      console.log('📊 Generated personalized score v1.1 (allergen-free):', {
        gtin: scoringResult.gtin,
        finalScore: scoringResult.final_score,
        version: scoringResult.score_version,
        components: {
          safety: scoringResult.components.safety.score,
          fit: {
            score: scoringResult.components.fit.score,
            diet_suitability: scoringResult.components.fit.diet_suitability,
            health_goal_alignment: scoringResult.components.fit.health_goal_alignment,
            ingredient_preference: scoringResult.components.fit.ingredient_preference,
            body_goal_alignment: scoringResult.components.fit.body_goal_alignment
          }
        },
        explanation: scoringResult.notes[1] // The explanation is in the second note
      });
      
      return scoringResult;
    } catch (error) {
      console.error('❌ Failed to generate personalized score:', error);
      throw new Error('Failed to generate personalized score');
    }
  });

export default scoreProcedure;