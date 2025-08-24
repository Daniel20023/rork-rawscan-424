import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { ProductService } from "../../../../services/ProductService";
// Temporarily disable personalized scoring due to import issues
// import { scoreProductPersonalized } from '../../../../utils/scoring';

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

export const getProductProcedure = publicProcedure
  .input(
    z.object({
      barcode: z.string().min(1, "Barcode is required"),
      userProfile: UserProfileSchema.optional()
    })
  )
  .query(async ({ input }: { input: { barcode: string; userProfile?: any } }) => {
    const { barcode } = input;
    // userProfile is temporarily unused until personalized scoring is re-enabled
    
    console.log(`🔍 tRPC: Fetching product for barcode: ${barcode}`);
    
    try {
      const result = await ProductService.getProduct(barcode);
      
      if (result.fromCache) {
        console.log(`✅ tRPC: Product found in cache for barcode: ${barcode}`);
      } else if (result.product) {
        console.log(`✅ tRPC: Product fetched from ${result.product.source} for barcode: ${barcode}`);
      } else if (result.notFound) {
        console.log(`⚠️ tRPC: Product not found for barcode: ${barcode}`);
      } else if (result.error) {
        console.error(`❌ tRPC: Error fetching product for barcode ${barcode}:`, result.error);
      }
      
      // Add personalized scoring if user profile is provided
      let scoringResult = null;
      // Temporarily disabled due to import issues
      // if (userProfile && result.product) {
      //   try {
      //     scoringResult = scoreProductPersonalized(result.product, userProfile);
      //     console.log('📊 Generated personalized score:', {
      //       finalScore: scoringResult.final_score,
      //       version: scoringResult.score_version
      //     });
      //   } catch (error) {
      //     console.error('❌ Failed to generate personalized score:', error);
      //   }
      // }
      
      console.log(`📤 tRPC: Returning result for barcode ${barcode}:`, {
        ok: result.ok,
        hasProduct: !!result.product,
        notFound: result.notFound,
        hasError: !!result.error
      });
      
      return {
        ...result,
        personalizedScore: scoringResult
      };
    } catch (error) {
      console.error(`💥 tRPC: Unexpected error for barcode ${barcode}:`, error);
      throw error;
    }
  });