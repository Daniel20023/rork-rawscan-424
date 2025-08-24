export type Product = {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  categories?: string[];
  ingredientsText?: string;
  allergens?: string[];
  servingSize?: {
    amount: number;
    unit: string;
    weightGrams?: number;
  };
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
    // Additional micronutrients
    vitaminC?: number;
    calcium?: number;
    iron?: number;
    potassium?: number;
    vitaminA?: number;
    vitaminD?: number;
    vitaminE?: number;
    vitaminK?: number;
    thiamin?: number;
    riboflavin?: number;
    niacin?: number;
    vitaminB6?: number;
    folate?: number;
    vitaminB12?: number;
    magnesium?: number;
    phosphorus?: number;
    zinc?: number;
  };
  // Indicates whether nutrition data is per serving or per 100g
  nutritionBasis?: "per_serving" | "per_100g";
  source: "off" | "local" | "usda";
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

// OpenFoodFacts API types
export type OFFProduct = {
  code: string;
  product?: {
    product_name?: string;
    brands?: string;
    image_url?: string;
    categories?: string;
    ingredients_text?: string;
    allergens?: string;
    nutriments?: {
      "energy-kcal_100g"?: number;
      carbohydrates_100g?: number;
      sugars_100g?: number;
      fiber_100g?: number;
      proteins_100g?: number;
      fat_100g?: number;
      "saturated-fat_100g"?: number;
      sodium_100g?: number;
      salt_100g?: number;
    };
  };
  status: number;
};

export type OFFSearchResult = {
  products: {
    code: string;
    product_name?: string;
    brands?: string;
    image_url?: string;
    categories?: string;
    ingredients_text?: string;
    allergens?: string;
    nutriments?: {
      "energy-kcal_100g"?: number;
      carbohydrates_100g?: number;
      sugars_100g?: number;
      fiber_100g?: number;
      proteins_100g?: number;
      fat_100g?: number;
      "saturated-fat_100g"?: number;
      sodium_100g?: number;
      salt_100g?: number;
    };
  }[];
  count: number;
  page: number;
  page_count: number;
  page_size: number;
  skip: number;
};

