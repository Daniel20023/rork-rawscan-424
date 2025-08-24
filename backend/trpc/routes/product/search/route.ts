import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { ProductService } from "../../../../services/ProductService";

export const searchProductProcedure = publicProcedure
  .input(
    z.object({
      query: z.string().min(1, "Search query is required"),
      limit: z.number().min(1).max(50).default(10),
    })
  )
  .query(async ({ input }: { input: { query: string; limit: number } }) => {
    const { query, limit } = input;
    
    console.log(`Searching products for query: ${query}, limit: ${limit}`);
    
    try {
      // For now, we'll implement a simple search using OpenFoodFacts
      // In the future, this could be expanded to search across multiple sources
      const searchResults = await ProductService.searchProducts(query, limit);
      
      console.log(`Found ${searchResults.products?.length || 0} products for query: ${query}`);
      
      return searchResults;
    } catch (error) {
      console.error(`Error searching products for query ${query}:`, error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        products: [],
      };
    }
  });