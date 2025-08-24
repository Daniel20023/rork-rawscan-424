import { trpc } from "@/lib/trpc";

export type Product = {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  categories?: string[];
  ingredientsText?: string;
  allergens?: string[];
  nutriments: {
    energyKcal?: number;
    carbohydrates?: number;
    sugars?: number;
    fiber?: number;
    protein?: number;
    fat?: number;
    saturatedFat?: number;
    sodium?: number;
    salt?: number;
  };
  source: "off" | "fdc" | "nutritionix";
};

export type ProductResponse = {
  ok: boolean;
  product?: Product;
  notFound?: boolean;
  error?: string;
  fromCache?: boolean;
};

export type ProductSearchResponse = {
  ok: boolean;
  products?: Product[];
  error?: string;
  totalCount?: number;
};

// Hook to get a product by barcode
export function useProduct(barcode: string, userProfile?: any) {
  const result = trpc.product.get.useQuery(
    { barcode, userProfile },
    {
      enabled: !!barcode && barcode.length > 0,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        console.log(`🔄 Retry attempt ${failureCount} for barcode ${barcode}:`, {
          message: error.message,
          code: error.data?.code,
          httpStatus: error.data?.httpStatus
        });
        
        // Don't retry on client errors (4xx) or specific server errors
        if (error.data?.httpStatus && error.data.httpStatus >= 400 && error.data.httpStatus < 500) {
          return false;
        }
        
        return failureCount < 2;
      }
    }
  );
  
  // Log errors and success separately
  if (result.error) {
    console.error('❌ Product fetch error:', {
      barcode,
      message: result.error.message,
      code: result.error.data?.code,
      httpStatus: result.error.data?.httpStatus,
      path: result.error.data?.path
    });
  }
  
  if (result.data) {
    console.log('✅ Product fetch success:', {
      barcode,
      ok: result.data?.ok,
      hasProduct: !!result.data?.product,
      notFound: result.data?.notFound,
      fromCache: result.data?.fromCache
    });
  }
  
  return result;
}

// Hook to search products by name/query
export function useProductSearch(query: string, limit: number = 10) {
  return trpc.product.search.useQuery(
    { query, limit },
    {
      enabled: !!query && query.length > 2,
      staleTime: 1000 * 60 * 2, // 2 minutes
    }
  );
}

// Utility functions for working with products
export const ProductUtils = {
  // Get a formatted nutrition label
  getNutritionLabel: (product: Product) => {
    const { nutriments } = product;
    const labels: string[] = [];
    
    if (nutriments.energyKcal) labels.push(`${nutriments.energyKcal} kcal`);
    if (nutriments.protein) labels.push(`${nutriments.protein}g protein`);
    if (nutriments.carbohydrates) labels.push(`${nutriments.carbohydrates}g carbs`);
    if (nutriments.fat) labels.push(`${nutriments.fat}g fat`);
    
    return labels.join(" • ");
  },

  // Check if product has allergens
  hasAllergens: (product: Product, allergenList: string[]) => {
    if (!product.allergens) return false;
    return allergenList.some(allergen => 
      product.allergens?.some(productAllergen => 
        productAllergen.toLowerCase().includes(allergen.toLowerCase())
      )
    );
  },

  // Get product display name
  getDisplayName: (product: Product) => {
    if (product.brand && product.name) {
      return `${product.brand} ${product.name}`;
    }
    return product.name;
  },

  // Check if product is high in a specific nutrient
  isHighIn: (product: Product, nutrient: keyof Product["nutriments"], threshold: number) => {
    const value = product.nutriments[nutrient];
    return value !== undefined && value > threshold;
  },

  // Get source display name
  getSourceName: (source: Product["source"]) => {
    switch (source) {
      case "off": return "OpenFoodFacts";
      case "fdc": return "USDA";
      case "nutritionix": return "Nutritionix";
      default: return "Unknown";
    }
  }
};