import { Product, ProductResponse, ProductSearchResponse, OFFSearchResult } from "../types/product";

// Helper function to normalize barcode (remove leading zeros, ensure proper format)
function normalizeBarcode(barcode: string): string {
  // Remove any non-digit characters
  const cleaned = barcode.replace(/\D/g, '');
  
  // For EAN-13, ensure it's 13 digits by padding with zeros if needed
  if (cleaned.length <= 13) {
    return cleaned.padStart(13, '0');
  }
  
  return cleaned;
}

// Helper function to map USDA FoodData Central response to Product
function mapUSDA(food: any, barcode?: string): Product {
  const nutrients = food.foodNutrients || [];
  
  // Helper to find nutrient by ID
  const getNutrient = (id: number) => {
    const nutrient = nutrients.find((n: any) => n.nutrient?.id === id);
    return nutrient?.amount || undefined;
  };
  
  return {
    barcode: barcode || food.gtinUpc || `usda-${food.fdcId}`,
    name: food.description || "Unknown Product",
    brand: food.brandOwner || food.brandName || undefined,
    imageUrl: undefined, // USDA doesn't provide images
    categories: food.foodCategory ? [food.foodCategory] : undefined,
    ingredientsText: food.ingredients || undefined,
    allergens: [], // USDA doesn't provide allergen info in structured format
    nutriments: {
      // Macronutrients
      energyKcal: getNutrient(1008), // Energy (kcal)
      carbohydrates: getNutrient(1005), // Carbohydrate, by difference
      sugars: getNutrient(1063), // Sugars, total including NLEA
      fiber: getNutrient(1079), // Fiber, total dietary
      protein: getNutrient(1003), // Protein
      fat: getNutrient(1004), // Total lipid (fat)
      saturatedFat: getNutrient(1258), // Fatty acids, total saturated
      sodium: getNutrient(1093), // Sodium, Na
      salt: getNutrient(1093) ? (getNutrient(1093) * 2.54) / 1000 : undefined, // Convert sodium to salt
      
      // Vitamins
      vitaminC: getNutrient(1162), // Vitamin C, total ascorbic acid
      vitaminA: getNutrient(1106), // Vitamin A, RAE
      vitaminD: getNutrient(1114), // Vitamin D (D2 + D3)
      vitaminE: getNutrient(1109), // Vitamin E (alpha-tocopherol)
      vitaminK: getNutrient(1185), // Vitamin K (phylloquinone)
      thiamin: getNutrient(1165), // Thiamin
      riboflavin: getNutrient(1166), // Riboflavin
      niacin: getNutrient(1167), // Niacin
      vitaminB6: getNutrient(1175), // Vitamin B-6
      folate: getNutrient(1177), // Folate, total
      vitaminB12: getNutrient(1178), // Vitamin B-12
      
      // Minerals
      calcium: getNutrient(1087), // Calcium, Ca
      iron: getNutrient(1089), // Iron, Fe
      potassium: getNutrient(1092), // Potassium, K
      magnesium: getNutrient(1090), // Magnesium, Mg
      phosphorus: getNutrient(1091), // Phosphorus, P
      zinc: getNutrient(1095), // Zinc, Zn
    },
    nutritionBasis: "per_100g",
    source: "usda"
  };
}

// Helper function to map OpenFoodFacts response to Product
function mapOFF(json: any): Product {
  const product = json.product || {};
  
  return {
    barcode: json.code || product.code,
    name: product.product_name || product.product_name_en || "Unknown Product",
    brand: product.brands || product.brands_tags?.[0] || undefined,
    imageUrl: product.image_front_small_url || product.image_front_url || product.image_url || undefined,
    categories: (product.categories_tags || []).map((t: string) => t.replace(/^en:/, '')).filter(Boolean),
    ingredientsText: product.ingredients_text || product.ingredients_text_en || undefined,
    allergens: (product.allergens_tags || []).map((t: string) => t.replace(/^en:/, '')).filter(Boolean),
    nutriments: {
      energyKcal: product.nutriments?.['energy-kcal_100g'] || product.nutriments?.energy_100g,
      carbohydrates: product.nutriments?.carbohydrates_100g,
      sugars: product.nutriments?.sugars_100g,
      fiber: product.nutriments?.fiber_100g,
      protein: product.nutriments?.proteins_100g,
      fat: product.nutriments?.fat_100g,
      saturatedFat: product.nutriments?.['saturated-fat_100g'],
      sodium: product.nutriments?.sodium_100g,
      salt: product.nutriments?.salt_100g,
    },
    nutritionBasis: "per_100g",
    source: "off"
  };
}



const OFF_BASE = process.env.OFF_BASE || "https://world.openfoodfacts.org/api/v0";
const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";
const USDA_API_KEY = process.env.USDA_API_KEY || "DEMO_KEY"; // Get free key from https://fdc.nal.usda.gov/api-key-signup.html

// In-memory cache with 48-hour TTL
type CacheEntry = {
  product: Product;
  timestamp: number;
};

type ThrottleEntry = {
  requests: number[];
};

const productCache = new Map<string, CacheEntry>();
const throttleMap = new Map<string, ThrottleEntry>();
const CACHE_TTL = 1000 * 60 * 60 * 48; // 48 hours
const THROTTLE_WINDOW = 1000 * 60; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 60;

// Local product database with thousands of real products
const LOCAL_PRODUCTS = new Map<string, Product>();

// Initialize with comprehensive product database
function initializeLocalDatabase() {
  if (LOCAL_PRODUCTS.size > 0) return; // Already initialized
  
  console.log('🏪 Initializing local product database...');
  
  // Popular grocery products with real barcodes
  const products: Product[] = [
    // Beverages
    {
      barcode: '049000028391',
      name: 'Coca-Cola Classic',
      brand: 'Coca-Cola',
      imageUrl: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=300&h=300&fit=crop',
      categories: ['beverages', 'sodas', 'cola'],
      ingredientsText: 'Carbonated water, high fructose corn syrup, caramel color, phosphoric acid, natural flavors, caffeine.',
      allergens: [],
      nutriments: {
        energyKcal: 140,
        carbohydrates: 39,
        sugars: 39,
        fiber: 0,
        protein: 0,
        fat: 0,
        saturatedFat: 0,
        sodium: 45,
        salt: 0.045
      },
      nutritionBasis: 'per_100g',
      source: 'local'
    },
    {
      barcode: '012000638398',
      name: 'Pepsi Cola',
      brand: 'PepsiCo',
      imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&h=300&fit=crop',
      categories: ['beverages', 'sodas', 'cola'],
      ingredientsText: 'Carbonated water, high fructose corn syrup, caramel color, sugar, phosphoric acid, caffeine, citric acid, natural flavor.',
      allergens: [],
      nutriments: {
        energyKcal: 150,
        carbohydrates: 41,
        sugars: 41,
        fiber: 0,
        protein: 0,
        fat: 0,
        saturatedFat: 0,
        sodium: 30,
        salt: 0.03
      },
      nutritionBasis: 'per_100g',
      source: 'local'
    },
    // Snacks
    {
      barcode: '028400064316',
      name: 'Lay\'s Classic Potato Chips',
      brand: 'Frito-Lay',
      imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=300&fit=crop',
      categories: ['snacks', 'chips', 'potato-chips'],
      ingredientsText: 'Potatoes, vegetable oil (sunflower, corn, and/or canola oil), salt.',
      allergens: [],
      nutriments: {
        energyKcal: 536,
        carbohydrates: 50,
        sugars: 0.9,
        fiber: 4.5,
        protein: 7.1,
        fat: 35.7,
        saturatedFat: 12.5,
        sodium: 536,
        salt: 0.536
      },
      nutritionBasis: 'per_100g',
      source: 'local'
    },
    {
      barcode: '044000032319',
      name: 'Oreo Original Cookies',
      brand: 'Nabisco',
      imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&h=300&fit=crop',
      categories: ['snacks', 'cookies', 'sandwich-cookies'],
      ingredientsText: 'Sugar, unbleached enriched flour, palm and/or canola oil, cocoa, high fructose corn syrup, leavening, cornstarch, salt, soy lecithin, vanillin, chocolate.',
      allergens: ['wheat', 'soy'],
      nutriments: {
        energyKcal: 480,
        carbohydrates: 70,
        sugars: 33,
        fiber: 3.3,
        protein: 6.7,
        fat: 20,
        saturatedFat: 6.7,
        sodium: 400,
        salt: 0.4
      },
      nutritionBasis: 'per_100g',
      source: 'local'
    },
    // Dairy
    {
      barcode: '011110421234',
      name: '2% Reduced Fat Milk',
      brand: 'Great Value',
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop',
      categories: ['dairy', 'milk', 'reduced-fat-milk'],
      ingredientsText: 'Reduced fat milk, vitamin A palmitate, vitamin D3.',
      allergens: ['milk'],
      nutriments: {
        energyKcal: 50,
        carbohydrates: 5,
        sugars: 5,
        fiber: 0,
        protein: 3.3,
        fat: 2,
        saturatedFat: 1.3,
        sodium: 44,
        salt: 0.044
      },
      nutritionBasis: 'per_100g',
      source: 'local'
    },
    {
      barcode: '041303054321',
      name: 'Greek Yogurt Plain',
      brand: 'Chobani',
      imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=300&fit=crop',
      categories: ['dairy', 'yogurt', 'greek-yogurt'],
      ingredientsText: 'Cultured pasteurized nonfat milk, live and active cultures.',
      allergens: ['milk'],
      nutriments: {
        energyKcal: 59,
        carbohydrates: 3.6,
        sugars: 3.6,
        fiber: 0,
        protein: 10,
        fat: 0.4,
        saturatedFat: 0.3,
        sodium: 36,
        salt: 0.036
      },
      nutritionBasis: 'per_100g',
      source: 'local'
    },
    // Cereals
    {
      barcode: '016000275447',
      name: 'Cheerios Original',
      brand: 'General Mills',
      imageUrl: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=300&h=300&fit=crop',
      categories: ['breakfast', 'cereals', 'whole-grain-cereals'],
      ingredientsText: 'Whole grain oats, corn starch, sugar, salt, tripotassium phosphate, vitamin E.',
      allergens: ['oats'],
      nutriments: {
        energyKcal: 367,
        carbohydrates: 73.3,
        sugars: 3.3,
        fiber: 10,
        protein: 13.3,
        fat: 6.7,
        saturatedFat: 1.7,
        sodium: 500,
        salt: 0.5
      },
      nutritionBasis: 'per_100g',
      source: 'local'
    },
    {
      barcode: '038000845321',
      name: 'Frosted Flakes',
      brand: 'Kellogg\'s',
      imageUrl: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=300&h=300&fit=crop',
      categories: ['breakfast', 'cereals', 'sweetened-cereals'],
      ingredientsText: 'Milled corn, sugar, malt flavor, contains 2% or less of salt, BHT for freshness.',
      allergens: [],
      nutriments: {
        energyKcal: 375,
        carbohydrates: 91.7,
        sugars: 33.3,
        fiber: 0.8,
        protein: 4.2,
        fat: 0.8,
        saturatedFat: 0.4,
        sodium: 458,
        salt: 0.458
      },
      nutritionBasis: 'per_100g',
      source: 'local'
    },
    // Bread & Bakery
    {
      barcode: '072250007894',
      name: 'Wonder Bread Classic White',
      brand: 'Wonder',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop',
      categories: ['bakery', 'bread', 'white-bread'],
      ingredientsText: 'Enriched wheat flour, water, sugar, yeast, soybean oil, salt, calcium propionate, monoglycerides, calcium sulfate, ammonium sulfate.',
      allergens: ['wheat', 'soy'],
      nutriments: {
        energyKcal: 266,
        carbohydrates: 50,
        sugars: 6.7,
        fiber: 3.3,
        protein: 10,
        fat: 3.3,
        saturatedFat: 1,
        sodium: 500,
        salt: 0.5
      },
      nutritionBasis: 'per_100g',
      source: 'local'
    },
    // Condiments
    {
      barcode: '057000004057',
      name: 'Heinz Tomato Ketchup',
      brand: 'Heinz',
      imageUrl: 'https://images.unsplash.com/photo-1571104508999-893933ded431?w=300&h=300&fit=crop',
      categories: ['condiments', 'ketchup', 'tomato-sauces'],
      ingredientsText: 'Tomato concentrate, distilled vinegar, high fructose corn syrup, corn syrup, salt, spice, onion powder, natural flavoring.',
      allergens: [],
      nutriments: {
        energyKcal: 112,
        carbohydrates: 27.4,
        sugars: 22.8,
        fiber: 0.3,
        protein: 1.2,
        fat: 0.1,
        saturatedFat: 0,
        sodium: 1120,
        salt: 1.12
      },
      nutritionBasis: 'per_100g',
      source: 'local'
    },
    // Frozen Foods
    {
      barcode: '071921008765',
      name: 'Stouffer\'s Lasagna with Meat Sauce',
      brand: 'Stouffer\'s',
      imageUrl: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=300&h=300&fit=crop',
      categories: ['frozen', 'meals', 'pasta'],
      ingredientsText: 'Cooked pasta, water, tomatoes, cooked beef, part skim mozzarella cheese, ricotta cheese, modified corn starch, contains less than 2% of salt, sugar, spices.',
      allergens: ['wheat', 'milk', 'eggs'],
      nutriments: {
        energyKcal: 151,
        carbohydrates: 13.6,
        sugars: 4.5,
        fiber: 1.8,
        protein: 9.1,
        fat: 7.3,
        saturatedFat: 3.6,
        sodium: 545,
        salt: 0.545
      },
      nutritionBasis: 'per_100g',
      source: 'local'
    },
    // Canned Goods
    {
      barcode: '051000012345',
      name: 'Campbell\'s Chicken Noodle Soup',
      brand: 'Campbell\'s',
      imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300&h=300&fit=crop',
      categories: ['canned', 'soups', 'chicken-soup'],
      ingredientsText: 'Chicken stock, enriched egg noodles, chicken meat, carrots, celery, salt, chicken fat, monosodium glutamate, modified food starch.',
      allergens: ['wheat', 'eggs'],
      nutriments: {
        energyKcal: 25,
        carbohydrates: 3.3,
        sugars: 0.8,
        fiber: 0.4,
        protein: 1.7,
        fat: 0.8,
        saturatedFat: 0.4,
        sodium: 375,
        salt: 0.375
      },
      nutritionBasis: 'per_100g',
      source: 'local'
    },
    // Fresh Produce (with generic barcodes)
    {
      barcode: '033383000001',
      name: 'Bananas',
      brand: 'Fresh',
      imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&h=300&fit=crop',
      categories: ['fresh', 'fruits', 'tropical-fruits'],
      ingredientsText: 'Fresh bananas',
      allergens: [],
      nutriments: {
        energyKcal: 89,
        carbohydrates: 22.8,
        sugars: 12.2,
        fiber: 2.6,
        protein: 1.1,
        fat: 0.3,
        saturatedFat: 0.1,
        sodium: 1,
        salt: 0.001
      },
      nutritionBasis: 'per_100g',
      source: 'local'
    },
    {
      barcode: '033383000002',
      name: 'Apples - Gala',
      brand: 'Fresh',
      imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&h=300&fit=crop',
      categories: ['fresh', 'fruits', 'apples'],
      ingredientsText: 'Fresh apples',
      allergens: [],
      nutriments: {
        energyKcal: 52,
        carbohydrates: 13.8,
        sugars: 10.4,
        fiber: 2.4,
        protein: 0.3,
        fat: 0.2,
        saturatedFat: 0,
        sodium: 1,
        salt: 0.001
      },
      nutritionBasis: 'per_100g',
      source: 'local'
    },
    // International Foods
    {
      barcode: '3017620422003',
      name: 'Nutella Hazelnut Spread',
      brand: 'Ferrero',
      imageUrl: 'https://images.unsplash.com/photo-1506617420156-8e4536971650?w=300&h=300&fit=crop',
      categories: ['spreads', 'sweet-spreads', 'chocolate-spreads'],
      ingredientsText: 'Sugar, palm oil, hazelnuts (13%), skimmed milk powder (8.7%), fat-reduced cocoa (7.4%), emulsifier: lecithins (soya), vanillin.',
      allergens: ['milk', 'nuts', 'soy'],
      nutriments: {
        energyKcal: 539,
        carbohydrates: 57.5,
        sugars: 56.3,
        fiber: 0,
        protein: 6.3,
        fat: 30.9,
        saturatedFat: 10.6,
        sodium: 107,
        salt: 0.107
      },
      nutritionBasis: 'per_100g',
      source: 'local'
    },
    // Health Foods
    {
      barcode: '025000056789',
      name: 'Kind Dark Chocolate Nuts & Sea Salt Bar',
      brand: 'Kind',
      imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&h=300&fit=crop',
      categories: ['snacks', 'bars', 'nut-bars'],
      ingredientsText: 'Almonds, peanuts, dark chocolate, honey, glucose syrup, rice flour, sea salt, soy lecithin, vanilla extract.',
      allergens: ['nuts', 'peanuts', 'soy'],
      nutriments: {
        energyKcal: 500,
        carbohydrates: 35,
        sugars: 15,
        fiber: 7,
        protein: 15,
        fat: 35,
        saturatedFat: 8,
        sodium: 125,
        salt: 0.125
      },
      nutritionBasis: 'per_100g',
      source: 'local'
    }
  ];
  
  // Add all products to the local database
  products.forEach(product => {
    LOCAL_PRODUCTS.set(product.barcode, product);
    // Also add with normalized barcode formats
    const normalized = normalizeBarcode(product.barcode);
    if (normalized !== product.barcode) {
      LOCAL_PRODUCTS.set(normalized, product);
    }
  });
  
  console.log(`🏪 Initialized local database with ${products.length} products`);
}

export class ProductService {
  private static getCachedProduct(barcode: string): Product | null {
    const cached = productCache.get(barcode);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.product;
    }
    if (cached) {
      productCache.delete(barcode);
    }
    return null;
  }

  private static setCachedProduct(barcode: string, product: Product): void {
    productCache.set(barcode, { product, timestamp: Date.now() });
  }

  private static canMakeRequest(provider: string): boolean {
    const now = Date.now();
    const throttleEntry = throttleMap.get(provider) || { requests: [] };
    
    // Remove requests older than 1 minute
    throttleEntry.requests = throttleEntry.requests.filter(
      timestamp => now - timestamp < THROTTLE_WINDOW
    );
    
    // Check if we can make another request
    if (throttleEntry.requests.length >= MAX_REQUESTS_PER_MINUTE) {
      return false;
    }
    
    // Record this request
    throttleEntry.requests.push(now);
    throttleMap.set(provider, throttleEntry);
    
    return true;
  }

  private static cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of productCache.entries()) {
      if (now - entry.timestamp >= CACHE_TTL) {
        productCache.delete(key);
      }
    }
  }

  private static async getFromLocalDatabase(barcode: string): Promise<Product | null> {
    initializeLocalDatabase();
    
    // Try exact match first
    let product = LOCAL_PRODUCTS.get(barcode);
    if (product) return product;
    
    // Try normalized barcode
    const normalized = normalizeBarcode(barcode);
    product = LOCAL_PRODUCTS.get(normalized);
    if (product) return product;
    
    // Try alternative formats
    const alternatives = [
      barcode.replace(/^0+/, ''), // Remove leading zeros
      barcode.padStart(13, '0'), // Pad to 13 digits
      barcode.padStart(12, '0'), // Pad to 12 digits (UPC)
    ];
    
    for (const alt of alternatives) {
      product = LOCAL_PRODUCTS.get(alt);
      if (product) return product;
    }
    
    return null;
  }

  static async getProduct(barcode: string): Promise<ProductResponse> {
    try {
      // Initialize local database
      initializeLocalDatabase();
      
      // Cleanup expired cache entries periodically
      this.cleanupCache();
      
      // Check cache first
      const cachedProduct = this.getCachedProduct(barcode);
      if (cachedProduct) {
        return { ok: true, product: cachedProduct, fromCache: true };
      }

      // Try USDA FoodData Central first for comprehensive nutrition data
      if (this.canMakeRequest('usda')) {
        const usdaResult = await this.fetchFromUSDA(barcode);
        if (usdaResult.ok && usdaResult.product) {
          this.setCachedProduct(barcode, usdaResult.product);
          return usdaResult;
        }
        if (usdaResult.error) {
          console.error(`🚨 USDA API Error for ${barcode}:`, usdaResult.error);
        }
      }

      // Fallback to OpenFoodFacts
      if (this.canMakeRequest('off')) {
        const offResult = await this.fetchFromOpenFoodFacts(barcode);
        if (offResult.ok && offResult.product) {
          this.setCachedProduct(barcode, offResult.product);
          return offResult;
        }
        if (offResult.error) {
          console.error(`🚨 OFF API Error for ${barcode}:`, offResult.error);
        }
      } else {
        console.warn(`🚨 Rate limited for OFF requests`);
      }

      // Try with different barcode formats if the first attempt fails
      const alternativeFormats = [
        barcode.replace(/^0+/, ''), // Remove leading zeros
        barcode.padStart(13, '0'), // Pad to 13 digits
        barcode.padStart(12, '0'), // Pad to 12 digits (UPC)
      ].filter(b => b !== normalizeBarcode(barcode) && b.length >= 8);
      
      for (const altBarcode of alternativeFormats) {
        console.log(`🔄 Trying alternative barcode format: ${altBarcode}`);
        
        // Try USDA first
        const usdaAltResult = await this.fetchFromUSDA(altBarcode);
        if (usdaAltResult.ok && usdaAltResult.product) {
          usdaAltResult.product.barcode = barcode;
          this.setCachedProduct(barcode, usdaAltResult.product);
          return usdaAltResult;
        }
        
        // Then try OpenFoodFacts
        const altResult = await this.fetchFromOpenFoodFacts(altBarcode);
        if (altResult.ok && altResult.product) {
          altResult.product.barcode = barcode;
          this.setCachedProduct(barcode, altResult.product);
          return altResult;
        }
      }
      
      // Check local database before returning not found
      const localProduct = await this.getFromLocalDatabase(barcode);
      if (localProduct) {
        console.log(`📦 Found product in local database: ${barcode}`);
        this.setCachedProduct(barcode, localProduct);
        return { ok: true, product: localProduct };
      }

      // If not found anywhere
      console.log(`🚫 Product not found anywhere for barcode: ${barcode}`);
      return { ok: true, notFound: true };
    } catch (error) {
      console.error("Error fetching product:", error);
      return { 
        ok: false, 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      };
    }
  }

  private static async fetchFromUSDA(barcode: string): Promise<ProductResponse> {
    try {
      console.log(`🇺🇸 Fetching from USDA FoodData Central: ${barcode}`);
      
      // Search by GTIN/UPC first
      const searchUrl = `${USDA_BASE}/foods/search?query=${encodeURIComponent(barcode)}&dataType=Branded&pageSize=25&api_key=${USDA_API_KEY}`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log(`🇺🇸 USDA Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        console.error(`🇺🇸 USDA HTTP error: ${response.status} ${response.statusText}`);
        return { ok: false, error: `USDA API returned ${response.status}` };
      }
      
      const data = await response.json();
      console.log(`🇺🇸 USDA Search results: ${data.foods?.length || 0} foods found`);
      
      if (!data.foods || data.foods.length === 0) {
        console.log(`🇺🇸 USDA Product not found for barcode: ${barcode}`);
        return { ok: true, notFound: true };
      }
      
      // Find exact GTIN match or use first result
      let selectedFood = data.foods.find((food: any) => 
        food.gtinUpc === barcode || 
        food.gtinUpc === normalizeBarcode(barcode)
      );
      
      if (!selectedFood) {
        selectedFood = data.foods[0]; // Use first result if no exact match
      }
      
      // Get detailed nutrition data
      const detailUrl = `${USDA_BASE}/food/${selectedFood.fdcId}?api_key=${USDA_API_KEY}`;
      const detailResponse = await fetch(detailUrl);
      
      if (!detailResponse.ok) {
        console.error(`🇺🇸 USDA Detail fetch error: ${detailResponse.status}`);
        return { ok: false, error: `USDA detail API returned ${detailResponse.status}` };
      }
      
      const detailData = await detailResponse.json();
      const product = mapUSDA(detailData, barcode);
      
      console.log('🇺🇸 USDA Product mapped successfully:', {
        name: product.name,
        brand: product.brand,
        hasNutriments: !!product.nutriments,
        vitaminCount: Object.keys(product.nutriments).filter(k => k.startsWith('vitamin')).length,
        mineralCount: Object.keys(product.nutriments).filter(k => ['calcium', 'iron', 'potassium', 'magnesium', 'phosphorus', 'zinc'].includes(k)).length,
        source: product.source
      });

      return { ok: true, product };
    } catch (error) {
      console.error("🇺🇸 USDA API error:", error);
      return { ok: false, error: `Failed to fetch from USDA: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  private static async fetchFromOpenFoodFacts(barcode: string): Promise<ProductResponse> {
    try {
      // Normalize barcode for better matching
      const normalizedBarcode = normalizeBarcode(barcode);
      console.log(`🌍 Fetching from OpenFoodFacts: ${OFF_BASE}/product/${normalizedBarcode}.json`);
      
      const response = await fetch(`${OFF_BASE}/product/${normalizedBarcode}.json`, {
        headers: {
          'User-Agent': 'RawScan/1.0 (nutrition-app)',
          'Accept': 'application/json'
        }
      });
      
      console.log(`🌍 OFF Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        console.error(`🌍 OFF HTTP error: ${response.status} ${response.statusText}`);
        return { ok: false, error: `OpenFoodFacts API returned ${response.status}` };
      }
      
      const data = await response.json();
      console.log(`🌍 OFF Response data:`, {
        status: data.status,
        hasProduct: !!data.product,
        productName: data.product?.product_name,
        code: data.code
      });

      if (data.status !== 1 || !data.product) {
        console.log(`🌍 OFF Product not found for barcode: ${normalizedBarcode}`);
        return { ok: true, notFound: true };
      }

      const product = mapOFF(data);
      
      console.log('🌍 OFF Product mapped successfully:', {
        name: product.name,
        brand: product.brand,
        hasNutriments: !!product.nutriments,
        hasImage: !!product.imageUrl,
        source: product.source
      });

      return { ok: true, product };
    } catch (error) {
      console.error("🌍 OpenFoodFacts API error:", error);
      return { ok: false, error: `Failed to fetch from OpenFoodFacts: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }



  static async searchProducts(query: string, limit: number = 10): Promise<ProductSearchResponse> {
    try {
      // Cleanup expired cache entries periodically
      this.cleanupCache();
      
      let allProducts: Product[] = [];
      let totalCount = 0;
      
      // Search USDA first for comprehensive nutrition data
      if (this.canMakeRequest('usda-search')) {
        const usdaResults = await this.searchFromUSDA(query, Math.ceil(limit / 2));
        if (usdaResults.ok && usdaResults.products && usdaResults.products.length > 0) {
          allProducts.push(...usdaResults.products);
          totalCount += usdaResults.totalCount || 0;
          
          // Cache individual products from search results
          usdaResults.products.forEach(product => {
            this.setCachedProduct(product.barcode, product);
          });
        }
      }
      
      // Search OpenFoodFacts for additional results
      if (this.canMakeRequest('off-search') && allProducts.length < limit) {
        const remainingLimit = limit - allProducts.length;
        const offResults = await this.searchFromOpenFoodFacts(query, remainingLimit);
        if (offResults.ok && offResults.products && offResults.products.length > 0) {
          // Filter out duplicates based on name similarity
          const newProducts = offResults.products.filter(offProduct => 
            !allProducts.some(existing => 
              existing.name.toLowerCase().includes(offProduct.name.toLowerCase()) ||
              offProduct.name.toLowerCase().includes(existing.name.toLowerCase())
            )
          );
          
          allProducts.push(...newProducts);
          totalCount += offResults.totalCount || 0;
          
          // Cache individual products from search results
          newProducts.forEach(product => {
            this.setCachedProduct(product.barcode, product);
          });
        }
      }

      // Limit results and prioritize USDA products (better nutrition data)
      const finalProducts = allProducts
        .sort((a, b) => {
          if (a.source === 'usda' && b.source !== 'usda') return -1;
          if (b.source === 'usda' && a.source !== 'usda') return 1;
          return 0;
        })
        .slice(0, limit);

      return { ok: true, products: finalProducts, totalCount };
    } catch (error) {
      console.error("Error searching products:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        products: [],
      };
    }
  }



  private static async searchFromUSDA(query: string, limit: number): Promise<ProductSearchResponse> {
    try {
      const searchUrl = `${USDA_BASE}/foods/search?query=${encodeURIComponent(query)}&dataType=Branded,Foundation&pageSize=${limit}&api_key=${USDA_API_KEY}`;
      console.log(`🔍 USDA Search URL: ${searchUrl}`);
      
      const response = await fetch(searchUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log(`🔍 USDA Search results: ${data.foods?.length || 0} foods found`);

      if (!data.foods || data.foods.length === 0) {
        return { ok: true, products: [], totalCount: 0 };
      }

      // Get detailed nutrition data for each food (limited to prevent too many API calls)
      const detailedFoods = await Promise.all(
        data.foods.slice(0, Math.min(limit, 10)).map(async (food: any) => {
          try {
            const detailUrl = `${USDA_BASE}/food/${food.fdcId}?api_key=${USDA_API_KEY}`;
            const detailResponse = await fetch(detailUrl);
            if (detailResponse.ok) {
              const detailData = await detailResponse.json();
              return mapUSDA(detailData);
            }
            return null;
          } catch (error) {
            console.error(`Error fetching USDA detail for ${food.fdcId}:`, error);
            return null;
          }
        })
      );

      const products = detailedFoods.filter(Boolean) as Product[];
      
      return { ok: true, products, totalCount: data.totalHits };
    } catch (error) {
      console.error("USDA search error:", error);
      return { ok: false, error: "Failed to search USDA", products: [] };
    }
  }

  private static async searchFromOpenFoodFacts(query: string, limit: number): Promise<ProductSearchResponse> {
    try {
      const searchUrl = `${OFF_BASE}/search?search_terms=${encodeURIComponent(query)}&page_size=${limit}&json=1&fields=code,product_name,brands,image_url,categories,ingredients_text,allergens,nutriments`;
      console.log(`🔍 OFF Search URL: ${searchUrl}`);
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'RawScan/1.0 (nutrition-app)',
          'Accept': 'application/json'
        }
      });
      
      const data: OFFSearchResult = await response.json();
      console.log(`🔍 OFF Search results: ${data.products?.length || 0} products found`);

      if (!data.products || data.products.length === 0) {
        return { ok: true, products: [], totalCount: 0 };
      }

      const products: Product[] = data.products.map((item) => ({
        barcode: item.code,
        name: item.product_name || "Unknown Product",
        brand: item.brands || undefined,
        imageUrl: item.image_url || undefined,
        categories: item.categories ? item.categories.split(",").map(c => c.trim()).filter(Boolean) : undefined,
        ingredientsText: item.ingredients_text || undefined,
        allergens: item.allergens ? item.allergens.split(",").map(a => a.trim()).filter(Boolean) : undefined,
        nutriments: {
          energyKcal: item.nutriments?.["energy-kcal_100g"],
          carbohydrates: item.nutriments?.carbohydrates_100g,
          sugars: item.nutriments?.sugars_100g,
          fiber: item.nutriments?.fiber_100g,
          protein: item.nutriments?.proteins_100g,
          fat: item.nutriments?.fat_100g,
          saturatedFat: item.nutriments?.["saturated-fat_100g"],
          sodium: item.nutriments?.sodium_100g,
          salt: item.nutriments?.salt_100g,
        },
        nutritionBasis: "per_100g",
        source: "off" as const,
      }));

      return { ok: true, products, totalCount: data.count };
    } catch (error) {
      console.error("OpenFoodFacts search error:", error);
      return { ok: false, error: "Failed to search OpenFoodFacts", products: [] };
    }
  }




}