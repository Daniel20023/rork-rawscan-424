import { Product } from '@/backend/types/product';

// Updated UserProfile schema (allergen-free)
interface UserProfile {
  user_id: string;
  body_goal: "lose_weight" | "gain_weight" | "maintain_weight";
  health_goals: ("low_sugar" | "high_protein" | "low_fat" | "keto" | "balanced")[];
  diet_type: "whole_foods" | "vegan" | "carnivore" | "gluten_free" | "vegetarian" | "balanced";
  avoid_ingredients?: ("seed_oils" | "artificial_colors")[];
  strictness: {
    diet_type: number;
    health_goals: number;
  };
  accomplish_future: (
    | "eat_and_live_healthier"
    | "boost_energy_and_mood"
    | "feel_better_about_my_body"
    | "clear_up_my_skin"
  )[];
}

// Legacy interface for backward compatibility
interface LegacyUserProfile {
  name: string;
  gender?: string;
  bodyGoals: string[];
  healthGoals: string[];
  dietGoals: string[];
  accomplishmentGoals: string[];
  hasCompletedOnboarding: boolean;
  profilePicture?: string;
}

interface ScoringComponents {
  safety: { score: number };
  fit: {
    score: number;
    diet_suitability: number;
    health_goal_alignment: number;
    ingredient_preference: number;
    body_goal_alignment: number;
  };
}

interface ScoringResult {
  gtin: string;
  final_score: number;
  components: ScoringComponents;
  notes: string[];
  score_version: string;
  inputs_hash: string;
  citations?: number[];
}

// Legacy interface for backward compatibility
interface LegacyProduct {
  nutrition: {
    calories: number;
    sugar: number;
    salt: number;
    saturated_fat: number;
    protein: number;
    fiber: number;
    carbs: number;
  };
  additives?: string[];
  ingredients?: string[];
  category?: string;
}

interface LegacyUserPreferences {
  gender?: string;
  bodyGoals: string[];
  healthGoals: string[];
  accomplishmentGoals: string[];
}

// New personalized scoring function (v1.1 - allergen-free)
export function scoreProductPersonalized(product: Product, userProfile: UserProfile): ScoringResult {
  console.log('🎯 Starting personalized scoring v1.1 (allergen-free)', {
    productName: product.name,
    userId: userProfile.user_id,
    bodyGoal: userProfile.body_goal,
    healthGoals: userProfile.health_goals,
    dietType: userProfile.diet_type,
    avoidIngredients: userProfile.avoid_ingredients
  });

  // Calculate safety score (unchanged)
  const safetyScore = calculateSafetyScore(product);
  
  // Calculate fit score with reweighted components (no allergen safety)
  const fitComponents = calculateFitScore(product, userProfile);
  
  // Final score: 65% safety + 35% fit
  const finalScore = Math.round(Math.max(0, Math.min(100, 0.65 * safetyScore + 0.35 * fitComponents.score)));
  
  // Generate inputs hash for reproducibility
  const inputsHash = generateInputsHash(product, userProfile);
  
  // Generate user-friendly explanation
  const explanation = generateScoreExplanation(product, userProfile, safetyScore, fitComponents);
  
  return {
    gtin: product.barcode,
    final_score: finalScore,
    components: {
      safety: { score: safetyScore },
      fit: fitComponents
    },
    notes: [
      "Allergen personalization is disabled until user allergen capture ships.",
      explanation
    ],
    score_version: "p1.1",
    inputs_hash: inputsHash,
    citations: []
  };
}

function calculateSafetyScore(product: Product): number {
  // Basic safety scoring based on WHO guidelines and general health principles
  let score = 82; // Base safety score
  
  // Normalize nutrient values to per serving
  const nutrients = normalizeNutrients(product);
  
  // Sugar penalties (per-serving basis)
  // WHO recommends <25g free sugars per day, so per serving should be <6g ideally
  if (nutrients.sugar > 12) {
    score -= 15;
  } else if (nutrients.sugar > 6) {
    score -= 8;
  }
  
  // Saturated fat penalties (per-serving basis)
  // WHO recommends <22g saturated fat per day, so per serving should be <4g
  if (nutrients.saturatedFat > 4) {
    score -= 10;
  } else if (nutrients.saturatedFat > 2) {
    score -= 5;
  }
  
  // Sodium penalties (per-serving basis)
  // WHO recommends <2g sodium per day, so per serving should be <400mg
  const sodium = nutrients.sodium * 1000; // Convert to mg
  if (sodium > 400) {
    score -= 10;
  } else if (sodium > 200) {
    score -= 5;
  }
  
  // Ultra-processed food penalties
  const additiveCount = countAdditives(product.ingredientsText || '');
  if (additiveCount > 3) {
    score -= additiveCount * 2;
  }
  
  return Math.max(0, Math.min(100, score));
}

function calculateFitScore(product: Product, userProfile: UserProfile) {
  const nutrients = normalizeNutrients(product);
  
  // Reweighted FitScore components (no AllergenSafety)
  const dietSuitability = calculateDietSuitability(product, userProfile.diet_type, userProfile.strictness.diet_type);
  const healthGoalAlignment = calculateHealthGoalAlignment(nutrients, userProfile.health_goals, userProfile.strictness.health_goals);
  const ingredientPreference = calculateIngredientPreference(product, userProfile.avoid_ingredients || []);
  const bodyGoalAlignment = calculateBodyGoalAlignment(nutrients, userProfile.body_goal);
  
  console.log('📊 FitScore components:', {
    dietSuitability: dietSuitability.toFixed(3),
    healthGoalAlignment: healthGoalAlignment.toFixed(3),
    ingredientPreference: ingredientPreference.toFixed(3),
    bodyGoalAlignment: bodyGoalAlignment.toFixed(3)
  });
  
  // Reweighted without AllergenSafety: 0.43, 0.29, 0.21, 0.07
  const fitScore = 100 * (
    0.43 * dietSuitability +
    0.29 * healthGoalAlignment +
    0.21 * ingredientPreference +
    0.07 * bodyGoalAlignment
  );
  
  console.log('📊 Final FitScore calculation:', {
    formula: '0.43*diet + 0.29*health + 0.21*ingredient + 0.07*body',
    calculation: `0.43*${dietSuitability.toFixed(3)} + 0.29*${healthGoalAlignment.toFixed(3)} + 0.21*${ingredientPreference.toFixed(3)} + 0.07*${bodyGoalAlignment.toFixed(3)}`,
    rawScore: fitScore.toFixed(2),
    finalScore: Math.max(0, Math.min(100, fitScore)).toFixed(2)
  });
  
  return {
    score: Math.max(0, Math.min(100, fitScore)),
    diet_suitability: dietSuitability,
    health_goal_alignment: healthGoalAlignment,
    ingredient_preference: ingredientPreference,
    body_goal_alignment: bodyGoalAlignment
  };
}

function normalizeNutrients(product: Product) {
  let sugar = product.nutriments.sugars || 0;
  let saturatedFat = product.nutriments.saturatedFat || 0;
  let sodium = product.nutriments.sodium || 0;
  let energyKcal = product.nutriments.energyKcal || 0;
  let fiber = product.nutriments.fiber || 0;
  let protein = product.nutriments.protein || 0;
  let carbohydrates = product.nutriments.carbohydrates || 0;
  let fat = product.nutriments.fat || 0;
  
  // Always convert to per-serving for consistent scoring
  if (product.nutritionBasis === 'per_100g' && product.servingSize?.weightGrams) {
    const factor = product.servingSize.weightGrams / 100;
    sugar *= factor;
    saturatedFat *= factor;
    sodium *= factor;
    energyKcal *= factor;
    fiber *= factor;
    protein *= factor;
    carbohydrates *= factor;
    fat *= factor;
  }
  // If no serving size info available for per_100g products, assume 30g serving
  else if (product.nutritionBasis === 'per_100g' && !product.servingSize?.weightGrams) {
    const factor = 30 / 100; // Assume 30g serving
    sugar *= factor;
    saturatedFat *= factor;
    sodium *= factor;
    energyKcal *= factor;
    fiber *= factor;
    protein *= factor;
    carbohydrates *= factor;
    fat *= factor;
  }
  // If already per_serving or per_serving basis, use as-is
  
  return {
    sugar,
    saturatedFat,
    sodium,
    energyKcal,
    fiber,
    protein,
    carbohydrates,
    fat,
    netCarbs: Math.max(0, carbohydrates - fiber)
  };
}

function calculateDietSuitability(product: Product, dietType: string, strictness: number): number {
  const ingredients = (product.ingredientsText || '').toLowerCase();
  
  switch (dietType) {
    case 'vegan':
      // Check for animal-derived ingredients
      const animalIngredients = ['milk', 'egg', 'meat', 'fish', 'honey', 'gelatin', 'whey', 'casein', 'lactose'];
      const hasAnimal = animalIngredients.some(ingredient => ingredients.includes(ingredient));
      return hasAnimal ? 0 : 1;
      
    case 'vegetarian':
      // Allow eggs/dairy, no meat/fish/gelatin
      const meatIngredients = ['meat', 'fish', 'gelatin', 'beef', 'pork', 'chicken', 'turkey'];
      const hasMeat = meatIngredients.some(ingredient => ingredients.includes(ingredient));
      return hasMeat ? 0 : 1;
      
    case 'carnivore':
      // Reward animal-derived, penalize grains/legumes/added sugar (per-serving basis)
      const nutrients = normalizeNutrients(product);
      const plantPenalties = ['grain', 'wheat', 'rice', 'bean', 'lentil'].filter(ingredient => 
        ingredients.includes(ingredient)
      ).length;
      let score = 0.8; // Base score
      if (nutrients.protein > 10) score += 0.2; // Reward high protein per serving
      if (nutrients.sugar > 3) score -= 0.3; // Penalize added sugar per serving
      score -= plantPenalties * 0.1; // Penalize plant ingredients
      return Math.max(0, Math.min(1, score));
      
    case 'gluten_free':
      // Check for gluten-containing ingredients
      const glutenIngredients = ['wheat', 'barley', 'rye', 'gluten', 'malt'];
      const hasGluten = glutenIngredients.some(ingredient => ingredients.includes(ingredient));
      if (hasGluten) {
        return Math.max(0, 1 - strictness); // Scale penalty by strictness
      }
      return 1;
      
    case 'whole_foods':
      // Soft penalties for UPF markers
      const upfMarkers = countUPFMarkers(ingredients);
      return Math.max(0, 1 - (upfMarkers * 0.1));
      
    case 'balanced':
    default:
      // Small bonus for minimally processed
      const additiveCount = countAdditives(product.ingredientsText || '');
      return additiveCount <= 3 ? 1 : Math.max(0.7, 1 - (additiveCount * 0.05));
  }
}

function calculateHealthGoalAlignment(nutrients: any, healthGoals: string[], strictness: number): number {
  if (healthGoals.length === 0) return 1;
  
  let totalScore = 0;
  
  healthGoals.forEach(goal => {
    let goalScore = 0;
    
    switch (goal) {
      case 'low_sugar':
        // Target low sugar per serving (<3g per serving)
        goalScore = Math.exp(-nutrients.sugar / 2);
        break;
        
      case 'high_protein':
        // Logistic function targeting good protein per serving (5-12g per serving)
        goalScore = 1 / (1 + Math.exp(-(nutrients.protein - 7) * 0.4));
        break;
        
      case 'low_fat':
        // Target low fat per serving (<3g per serving)
        goalScore = Math.exp(-nutrients.fat / 2);
        break;
        
      case 'keto':
        // Target very low net carbs per serving (<2g per serving)
        goalScore = Math.exp(-Math.max(0, nutrients.netCarbs - 2) / 1.5);
        break;
        
      case 'balanced':
        // Cosine similarity to 30:40:30 (protein:carbs:fat) macro split
        const totalCals = nutrients.protein * 4 + nutrients.carbohydrates * 4 + nutrients.fat * 9;
        if (totalCals > 0) {
          const proteinRatio = (nutrients.protein * 4) / totalCals;
          const carbRatio = (nutrients.carbohydrates * 4) / totalCals;
          const fatRatio = (nutrients.fat * 9) / totalCals;
          
          // Target ratios
          const targetProtein = 0.3;
          const targetCarb = 0.4;
          const targetFat = 0.3;
          
          // Cosine similarity
          const dotProduct = proteinRatio * targetProtein + carbRatio * targetCarb + fatRatio * targetFat;
          const magnitudeActual = Math.sqrt(proteinRatio ** 2 + carbRatio ** 2 + fatRatio ** 2);
          const magnitudeTarget = Math.sqrt(targetProtein ** 2 + targetCarb ** 2 + targetFat ** 2);
          
          goalScore = magnitudeActual > 0 ? dotProduct / (magnitudeActual * magnitudeTarget) : 0;
        }
        break;
        
      default:
        goalScore = 1;
    }
    
    totalScore += goalScore;
  });
  
  const averageScore = totalScore / healthGoals.length;
  return Math.pow(averageScore, strictness); // Apply strictness as exponent
}

function calculateIngredientPreference(product: Product, avoidIngredients: string[]): number {
  const ingredients = (product.ingredientsText || '').toLowerCase();
  let score = 1;
  
  // Seed oils penalty
  if (avoidIngredients.includes('seed_oils')) {
    const seedOils = ['sunflower oil', 'safflower oil', 'soy oil', 'canola oil', 'corn oil', 'cottonseed oil'];
    const seedOilCount = seedOils.filter(oil => ingredients.includes(oil)).length;
    score -= Math.min(0.35, seedOilCount * 0.15);
  }
  
  // Artificial colors penalty
  if (avoidIngredients.includes('artificial_colors')) {
    const artificialColors = ['red 40', 'yellow 5', 'blue 1', 'artificial color'];
    const hasArtificialColors = artificialColors.some(color => ingredients.includes(color));
    if (hasArtificialColors) {
      score -= 0.20;
    }
  }
  
  // Artificial sweeteners penalty
  const sweeteners = [
    { name: 'aspartame', penalty: 0.25 },
    { name: 'sucralose', penalty: 0.20 },
    { name: 'acesulfame', penalty: 0.20 }
  ];
  
  sweeteners.forEach(sweetener => {
    if (ingredients.includes(sweetener.name)) {
      score -= sweetener.penalty;
    }
  });
  
  // Positive ingredients (capped at +0.08)
  let bonus = 0;
  const positiveIngredients = [
    { name: 'extra virgin olive oil', bonus: 0.04 },
    { name: 'avocado oil', bonus: 0.03 },
    { name: 'grass-fed', bonus: 0.03 },
    { name: 'raw honey', bonus: 0.02 }
  ];
  
  positiveIngredients.forEach(ingredient => {
    if (ingredients.includes(ingredient.name)) {
      bonus += ingredient.bonus;
    }
  });
  
  score += Math.min(0.08, bonus);
  
  return Math.max(0, Math.min(1, score));
}

function calculateBodyGoalAlignment(nutrients: any, bodyGoal: string): number {
  switch (bodyGoal) {
    case 'lose_weight':
      // Favor low calorie & high protein per serving; bonus for fiber ≥2g per serving
      let score = 0.5; // Base score
      
      // Calorie penalty/bonus per serving
      if (nutrients.energyKcal < 80) {
        score += 0.3;
      } else if (nutrients.energyKcal > 200) {
        score -= 0.2;
      }
      
      // Protein bonus per serving
      if (nutrients.protein > 8) {
        score += 0.2;
      } else if (nutrients.protein > 4) {
        score += 0.1;
      }
      
      // Fiber bonus per serving
      if (nutrients.fiber >= 2) {
        score += 0.1;
      }
      
      return Math.max(0, Math.min(1, score));
      
    case 'gain_weight':
      // Favor high calorie per serving with adequate protein
      let gainScore = 0.5;
      
      if (nutrients.energyKcal > 250 && nutrients.protein > 5) {
        gainScore += 0.4;
      } else if (nutrients.energyKcal > 150) {
        gainScore += 0.2;
      }
      
      // Adequate protein bonus per serving
      if (nutrients.protein > 6) {
        gainScore += 0.1;
      }
      
      return Math.max(0, Math.min(1, gainScore));
      
    case 'maintain_weight':
    default:
      // Mild preference for balanced macros
      const totalCals = nutrients.protein * 4 + nutrients.carbohydrates * 4 + nutrients.fat * 9;
      if (totalCals === 0) return 0.5;
      
      const proteinRatio = (nutrients.protein * 4) / totalCals;
      const carbRatio = (nutrients.carbohydrates * 4) / totalCals;
      const fatRatio = (nutrients.fat * 9) / totalCals;
      
      // Prefer moderate ratios
      const balanceScore = 1 - Math.abs(proteinRatio - 0.25) - Math.abs(carbRatio - 0.45) - Math.abs(fatRatio - 0.30);
      return Math.max(0.3, Math.min(1, balanceScore));
  }
}

function countUPFMarkers(ingredients: string): number {
  const upfMarkers = [
    'emulsifier', 'stabilizer', 'thickener', 'artificial flavor', 'natural flavor',
    'modified starch', 'high fructose corn syrup', 'corn syrup', 'dextrose',
    'maltodextrin', 'monosodium glutamate', 'msg'
  ];
  
  return upfMarkers.filter(marker => ingredients.includes(marker)).length;
}

function generateInputsHash(product: Product, userProfile: UserProfile): string {
  // Simple hash generation for reproducibility
  const productData = JSON.stringify({
    barcode: product.barcode,
    nutriments: product.nutriments,
    ingredientsText: product.ingredientsText
  });
  
  const profileData = JSON.stringify({
    body_goal: userProfile.body_goal,
    health_goals: userProfile.health_goals,
    diet_type: userProfile.diet_type,
    avoid_ingredients: userProfile.avoid_ingredients,
    strictness: userProfile.strictness
  });
  
  // Simple hash (in production, use crypto.createHash)
  const combined = productData + profileData + "w1.1";
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `sha256:${Math.abs(hash).toString(16)}`;
}

function generateScoreExplanation(product: Product, userProfile: UserProfile, safetyScore: number, fitComponents: any): string {
  const nutrients = normalizeNutrients(product);
  const explanations: string[] = [];
  
  // Health goal explanations (per serving basis)
  if (userProfile.health_goals.includes('low_sugar')) {
    if (nutrients.sugar < 2) {
      explanations.push('Low sugar ✅');
    } else if (nutrients.sugar > 6) {
      explanations.push('High sugar ❌');
    }
  }
  
  if (userProfile.health_goals.includes('high_protein')) {
    if (nutrients.protein > 8) {
      explanations.push('High protein ✅');
    } else if (nutrients.protein < 2) {
      explanations.push('Low protein ❌');
    }
  }
  
  if (userProfile.health_goals.includes('keto')) {
    if (nutrients.netCarbs < 2) {
      explanations.push('Keto-friendly ✅');
    } else if (nutrients.netCarbs > 3) {
      explanations.push('Too many carbs for keto ❌');
    }
  }
  
  // Ingredient preference explanations
  const ingredients = (product.ingredientsText || '').toLowerCase();
  if (userProfile.avoid_ingredients?.includes('seed_oils')) {
    const seedOils = ['sunflower oil', 'safflower oil', 'soy oil', 'canola oil', 'corn oil', 'cottonseed oil'];
    const hasSeedOils = seedOils.some(oil => ingredients.includes(oil));
    if (hasSeedOils) {
      explanations.push('Contains seed oils ❌');
    }
  }
  
  if (userProfile.avoid_ingredients?.includes('artificial_colors')) {
    const artificialColors = ['red 40', 'yellow 5', 'blue 1', 'artificial color'];
    const hasArtificialColors = artificialColors.some(color => ingredients.includes(color));
    if (hasArtificialColors) {
      explanations.push('Contains artificial colors ❌');
    }
  }
  
  // Diet type explanations
  if (userProfile.diet_type === 'vegan') {
    const animalIngredients = ['milk', 'egg', 'meat', 'fish', 'honey', 'gelatin', 'whey', 'casein', 'lactose'];
    const hasAnimal = animalIngredients.some(ingredient => ingredients.includes(ingredient));
    if (hasAnimal) {
      explanations.push('Contains animal products ❌');
    } else {
      explanations.push('Vegan-friendly ✅');
    }
  }
  
  if (userProfile.diet_type === 'gluten_free') {
    const glutenIngredients = ['wheat', 'barley', 'rye', 'gluten', 'malt'];
    const hasGluten = glutenIngredients.some(ingredient => ingredients.includes(ingredient));
    if (hasGluten) {
      explanations.push('Contains gluten ❌');
    } else {
      explanations.push('Gluten-free ✅');
    }
  }
  
  const explanation = explanations.length > 0 
    ? explanations.join(', ') + ` → Score: ${Math.round((safetyScore * 0.65) + (fitComponents.score * 0.35))}/100`
    : `Score: ${Math.round((safetyScore * 0.65) + (fitComponents.score * 0.35))}/100`;
    
  return explanation;
}

// Legacy function for backward compatibility
export function scoreProduct(product: Product, userProfile: LegacyUserProfile): ScoringResult {
  // Convert legacy profile to new format for compatibility
  const newProfile: UserProfile = {
    user_id: "legacy_user",
    body_goal: userProfile.bodyGoals[0] as any || "maintain_weight",
    health_goals: userProfile.healthGoals as any || [],
    diet_type: userProfile.dietGoals[0] as any || "balanced",
    avoid_ingredients: [],
    strictness: {
      diet_type: 0.8,
      health_goals: 0.7
    },
    accomplish_future: userProfile.accomplishmentGoals.map(goal => {
      switch (goal) {
        case 'eat_healthier': return 'eat_and_live_healthier';
        case 'boost_energy': return 'boost_energy_and_mood';
        case 'feel_better': return 'feel_better_about_my_body';
        case 'clear_skin': return 'clear_up_my_skin';
        default: return 'eat_and_live_healthier';
      }
    }) as any
  };
  
  // Use new scoring system
  const newResult = scoreProductPersonalized(product, newProfile);
  
  // Convert back to legacy format
  return {
    gtin: newResult.gtin,
    final_score: newResult.final_score,
    components: newResult.components,
    notes: newResult.notes,
    score_version: newResult.score_version,
    inputs_hash: newResult.inputs_hash,
    citations: newResult.citations
  };
}

function countAdditives(ingredientsText: string): number {
  if (!ingredientsText) return 0;
  
  // Common additive patterns (E-numbers, preservatives, etc.)
  const additivePatterns = [
    /E\d{3,4}/gi, // E-numbers
    /sodium benzoate/gi,
    /potassium sorbate/gi,
    /citric acid/gi,
    /ascorbic acid/gi,
    /natural flavors?/gi,
    /artificial flavors?/gi,
    /modified starch/gi,
    /lecithin/gi,
    /carrageenan/gi
  ];
  
  let count = 0;
  additivePatterns.forEach(pattern => {
    const matches = ingredientsText.match(pattern);
    if (matches) count += matches.length;
  });
  
  return count;
}



// Legacy function for backward compatibility
export function getHealthScore(product: LegacyProduct, preferences: LegacyUserPreferences): number {
  let score = 70; // Start with neutral score
  
  // Safety check for product and nutrition
  if (!product || !product.nutrition) {
    console.warn('Product or nutrition data missing:', product);
    return 50; // Return neutral score for missing data
  }
  
  const { nutrition } = product;
  
  // WHO guidelines baseline scoring
  score = applyWHOGuidelines(score, nutrition);
  
  // Apply body goal adjustments
  score = applyBodyGoalAdjustments(score, nutrition, preferences?.bodyGoals || [], product);
  
  // Apply health goal adjustments
  score = applyHealthGoalAdjustments(score, nutrition, preferences?.healthGoals || [], product);
  
  // Apply accomplishment goal adjustments
  score = applyAccomplishmentGoalAdjustments(score, nutrition, preferences?.accomplishmentGoals || [], product);
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

function applyWHOGuidelines(score: number, nutrition: any): number {
  // Ensure nutrition values exist and are numbers
  const sugar = typeof nutrition?.sugar === 'number' ? nutrition.sugar : 0;
  const salt = typeof nutrition?.salt === 'number' ? nutrition.salt : 0;
  const saturated_fat = typeof nutrition?.saturated_fat === 'number' ? nutrition.saturated_fat : 0;
  const fiber = typeof nutrition?.fiber === 'number' ? nutrition.fiber : 0;
  
  // WHO: Free sugars should be < 10% of total energy (ideally < 5%)
  // Assuming 2000 cal diet: < 50g sugar (ideally < 25g)
  if (sugar > 25) {
    score -= Math.min(25, (sugar - 25) * 1.5);
  } else if (sugar < 5) {
    score += 10;
  }
  
  // WHO: Limit salt to under 5g/day (2g sodium)
  // Per 100g product should be much lower
  if (salt > 1.5) {
    score -= Math.min(20, (salt - 1.5) * 10);
  } else if (salt < 0.3) {
    score += 8;
  }
  
  // WHO: Limit saturated fat to < 10% of total energy
  // Roughly < 22g for 2000 cal diet
  if (saturated_fat > 10) {
    score -= Math.min(15, (saturated_fat - 10) * 1.2);
  } else if (saturated_fat < 3) {
    score += 5;
  }
  
  // WHO: At least 25g fiber per day - reward high fiber foods
  if (fiber > 5) {
    score += Math.min(15, fiber * 2);
  }
  
  return score;
}

function applyBodyGoalAdjustments(score: number, nutrition: any, bodyGoals: string[], product: LegacyProduct): number {
  // Ensure nutrition values exist and are numbers
  const calories = typeof nutrition?.calories === 'number' ? nutrition.calories : 0;
  const sugar = typeof nutrition?.sugar === 'number' ? nutrition.sugar : 0;
  const salt = typeof nutrition?.salt === 'number' ? nutrition.salt : 0;
  const saturated_fat = typeof nutrition?.saturated_fat === 'number' ? nutrition.saturated_fat : 0;
  const protein = typeof nutrition?.protein === 'number' ? nutrition.protein : 0;
  const fiber = typeof nutrition?.fiber === 'number' ? nutrition.fiber : 0;
  if (bodyGoals.includes('lose_weight')) {
    // Favor high-fiber fruits/vegetables, lean proteins, low sugar/sat fat
    if (fiber > 3) score += 12;
    if (protein > 10 && saturated_fat < 5) score += 10;
    
    // Penalize high calorie density
    if (calories > 300) {
      score -= Math.min(20, (calories - 300) / 15);
    }
    
    // Extra penalties for sugar and sodium
    score -= sugar * 0.8;
    score -= salt * 2;
    
    // Penalize ultra-processed (many additives)
    if (product.additives && product.additives.length > 3) {
      score -= product.additives.length * 2;
    }
  }
  
  if (bodyGoals.includes('gain_weight')) {
    // Favor energy-dense nutritious foods
    if (calories > 400 && protein > 8) {
      score += 15;
    }
    
    // Reward healthy fats (assume if high cal but low sugar)
    if (calories > 300 && sugar < 10) {
      score += 10;
    }
    
    // Still penalize empty calories (high sugar, low nutrients)
    if (sugar > 20 && protein < 3 && fiber < 2) {
      score -= 15;
    }
  }
  
  if (bodyGoals.includes('maintain_weight')) {
    // Balanced approach - moderate penalties/rewards
    if (sugar > 20) score -= 10;
    if (salt > 2) score -= 8;
    if (fiber > 3) score += 8;
    if (protein > 8) score += 6;
  }
  
  return score;
}

function applyHealthGoalAdjustments(score: number, nutrition: any, healthGoals: string[], product: LegacyProduct): number {
  // Ensure nutrition values exist and are numbers
  const sugar = typeof nutrition?.sugar === 'number' ? nutrition.sugar : 0;
  const saturated_fat = typeof nutrition?.saturated_fat === 'number' ? nutrition.saturated_fat : 0;
  const protein = typeof nutrition?.protein === 'number' ? nutrition.protein : 0;
  const fiber = typeof nutrition?.fiber === 'number' ? nutrition.fiber : 0;
  const carbs = typeof nutrition?.carbs === 'number' ? nutrition.carbs : 0;
  if (healthGoals.includes('whole_foods')) {
    // Favor short ingredient lists, penalize ultra-processed
    const ingredientCount = product.ingredients?.length || 0;
    if (ingredientCount <= 5) {
      score += 15;
    } else if (ingredientCount > 10) {
      score -= 10;
    }
    
    // Penalize additives heavily
    if (product.additives && product.additives.length > 0) {
      score -= product.additives.length * 3;
    }
  }
  
  if (healthGoals.includes('vegan') || healthGoals.includes('vegetarian')) {
    // This would need ingredient analysis for animal products
    // For now, reward plant-based indicators
    if (fiber > 3) score += 12;
    if (protein > 8 && saturated_fat < 3) score += 10;
  }
  
  if (healthGoals.includes('keto')) {
    // Strict carb limits
    if (carbs < 5) {
      score += 25;
    } else if (carbs < 10) {
      score += 10;
    } else {
      score -= Math.min(30, carbs * 2);
    }
    
    // Favor moderate protein, don't penalize fats as much
    if (protein > 5) score += 8;
  }
  
  if (healthGoals.includes('carnivore')) {
    // Would need ingredient analysis for animal vs plant
    // Favor high protein, penalize carbs
    if (protein > 15) score += 20;
    if (carbs > 5) score -= 15;
  }
  
  if (healthGoals.includes('gluten_free')) {
    // Would need ingredient analysis for gluten
    // For now, no specific adjustments
  }
  
  if (healthGoals.includes('low_sugar')) {
    if (sugar < 2) {
      score += 20;
    } else if (sugar < 5) {
      score += 10;
    } else {
      score -= sugar * 2;
    }
  }
  
  if (healthGoals.includes('high_protein')) {
    if (protein > 15) {
      score += 20;
    } else if (protein > 10) {
      score += 12;
    } else if (protein < 5) {
      score -= 10;
    }
  }
  
  if (healthGoals.includes('low_fat')) {
    if (saturated_fat < 2) {
      score += 15;
    } else if (saturated_fat > 8) {
      score -= saturated_fat * 1.5;
    }
  }
  
  if (healthGoals.includes('skin_friendly')) {
    // Penalize high-glycemic (high sugar)
    if (sugar > 15) {
      score -= 15;
    }
    
    // Reward antioxidant-rich foods (fruits/vegetables - high fiber indicator)
    if (fiber > 4) {
      score += 12;
    }
  }
  
  return score;
}

function applyAccomplishmentGoalAdjustments(score: number, nutrition: any, accomplishmentGoals: string[], product: LegacyProduct): number {
  // Ensure nutrition values exist and are numbers
  const sugar = typeof nutrition?.sugar === 'number' ? nutrition.sugar : 0;
  const salt = typeof nutrition?.salt === 'number' ? nutrition.salt : 0;
  const saturated_fat = typeof nutrition?.saturated_fat === 'number' ? nutrition.saturated_fat : 0;
  const protein = typeof nutrition?.protein === 'number' ? nutrition.protein : 0;
  const fiber = typeof nutrition?.fiber === 'number' ? nutrition.fiber : 0;
  const carbs = typeof nutrition?.carbs === 'number' ? nutrition.carbs : 0;
  if (accomplishmentGoals.includes('eat_healthier')) {
    // General healthy eating principles
    if (fiber > 3) score += 8;
    if (protein > 8) score += 6;
    if (sugar > 15) score -= 8;
    if (salt > 1.5) score -= 6;
  }
  
  if (accomplishmentGoals.includes('boost_energy')) {
    // Favor steady-release carbs (fiber), penalize sugar crashes
    if (fiber > 3 && carbs > 10) score += 10;
    if (protein > 8) score += 8; // B-vitamins in protein
    if (sugar > 20) score -= 12; // Avoid energy crashes
  }
  
  if (accomplishmentGoals.includes('stay_motivated')) {
    // Favor convenient healthy options (less penalty for some processing)
    if (product.additives && product.additives.length < 5) {
      score += 5; // Some processing OK for convenience
    }
  }
  
  if (accomplishmentGoals.includes('feel_better_body')) {
    // Similar to weight management
    if (fiber > 3) score += 10;
    if (protein > 10) score += 8;
    if (sugar > 15) score -= 10;
    if (saturated_fat > 8) score -= 8;
  }
  
  if (accomplishmentGoals.includes('clear_skin')) {
    // Anti-inflammatory foods
    if (fiber > 4) score += 12; // Antioxidant-rich indicator
    if (sugar > 12) score -= 15; // High-glycemic penalty
    if (saturated_fat > 6) score -= 8; // Inflammatory fats
  }
  
  return score;
}

export function getNutrientAnalysis(product: LegacyProduct, preferences: LegacyUserPreferences) {
  const analysis = [];
  const { nutrition } = product;
  const bodyGoals = preferences?.bodyGoals || [];
  const healthGoals = preferences?.healthGoals || [];
  const accomplishmentGoals = preferences?.accomplishmentGoals || [];
  
  // Ensure nutrition values exist and are numbers
  const sugar = typeof nutrition?.sugar === 'number' ? nutrition.sugar : 0;
  const salt = typeof nutrition?.salt === 'number' ? nutrition.salt : 0;
  const saturated_fat = typeof nutrition?.saturated_fat === 'number' ? nutrition.saturated_fat : 0;
  const protein = typeof nutrition?.protein === 'number' ? nutrition.protein : 0;
  const fiber = typeof nutrition?.fiber === 'number' ? nutrition.fiber : 0;
  const carbs = typeof nutrition?.carbs === 'number' ? nutrition.carbs : 0;
  const calories = typeof nutrition?.calories === 'number' ? nutrition.calories : 0;

  // WHO-based general analysis
  if (sugar > 25) {
    analysis.push({
      impact: "negative" as const,
      message: "Very high sugar content exceeds WHO recommendations (>25g per 100g)",
    });
  } else if (sugar > 15) {
    analysis.push({
      impact: "warning" as const,
      message: "High sugar content - WHO recommends limiting free sugars",
    });
  } else if (sugar < 5) {
    analysis.push({
      impact: "positive" as const,
      message: "Low sugar content supports stable blood sugar levels",
    });
  }

  // Sodium analysis based on WHO guidelines
  if (salt > 1.5) {
    analysis.push({
      impact: "negative" as const,
      message: "High sodium content - WHO recommends less than 5g salt per day",
    });
  } else if (salt < 0.3) {
    analysis.push({
      impact: "positive" as const,
      message: "Low sodium content supports healthy blood pressure",
    });
  }

  // Fiber analysis
  if (fiber > 5) {
    analysis.push({
      impact: "positive" as const,
      message: "Excellent fiber content aids digestion and heart health",
    });
  } else if (fiber > 3) {
    analysis.push({
      impact: "positive" as const,
      message: "Good fiber content supports digestive health",
    });
  }

  // Body goal specific analysis
  if (bodyGoals.includes('lose_weight')) {
    if (calories > 300) {
      analysis.push({
        impact: "negative" as const,
        message: "High calorie density may challenge weight loss goals",
      });
    } else if (calories < 150 && fiber > 2) {
      analysis.push({
        impact: "positive" as const,
        message: "Low calorie, high fiber - excellent for weight management",
      });
    }
  }

  if (bodyGoals.includes('gain_weight')) {
    if (calories > 400 && protein > 8) {
      analysis.push({
        impact: "positive" as const,
        message: "Energy-dense with good protein - supports healthy weight gain",
      });
    } else if (sugar > 20 && protein < 3) {
      analysis.push({
        impact: "negative" as const,
        message: "High sugar, low protein - provides empty calories",
      });
    }
  }

  // Health goal specific analysis
  if (healthGoals.includes('keto')) {
    if (carbs < 5) {
      analysis.push({
        impact: "positive" as const,
        message: "Very low carb content - perfect for ketogenic diet",
      });
    } else if (carbs > 10) {
      analysis.push({
        impact: "negative" as const,
        message: "Too many carbs for ketogenic diet (>10g per 100g)",
      });
    }
  }

  if (healthGoals.includes('high_protein')) {
    if (protein > 15) {
      analysis.push({
        impact: "positive" as const,
        message: "Excellent protein content supports muscle health and satiety",
      });
    } else if (protein < 5) {
      analysis.push({
        impact: "negative" as const,
        message: "Low protein content for your high-protein goals",
      });
    }
  }

  if (healthGoals.includes('low_sugar')) {
    if (sugar < 2) {
      analysis.push({
        impact: "positive" as const,
        message: "Excellent - very low sugar content aligns with your goals",
      });
    } else if (sugar > 10) {
      analysis.push({
        impact: "negative" as const,
        message: "High sugar content conflicts with your low-sugar goals",
      });
    }
  }

  if (healthGoals.includes('whole_foods')) {
    const ingredientCount = product.ingredients?.length || 0;
    const additiveCount = product.additives?.length || 0;
    
    if (ingredientCount <= 5 && additiveCount === 0) {
      analysis.push({
        impact: "positive" as const,
        message: "Simple ingredient list with no additives - aligns with whole foods approach",
      });
    } else if (additiveCount > 3) {
      analysis.push({
        impact: "negative" as const,
        message: "Multiple additives present - may be ultra-processed",
      });
    }
  }

  if (healthGoals.includes('skin_friendly')) {
    if (sugar > 15) {
      analysis.push({
        impact: "negative" as const,
        message: "High sugar content may trigger skin issues through inflammation",
      });
    } else if (fiber > 4) {
      analysis.push({
        impact: "positive" as const,
        message: "High fiber content supports skin health through antioxidants",
      });
    }
  }

  // Accomplishment goal analysis
  if (accomplishmentGoals.includes('boost_energy')) {
    if (fiber > 3 && carbs > 10 && sugar < 10) {
      analysis.push({
        impact: "positive" as const,
        message: "Complex carbs with fiber provide sustained energy release",
      });
    } else if (sugar > 20) {
      analysis.push({
        impact: "negative" as const,
        message: "High sugar may cause energy spikes followed by crashes",
      });
    }
  }

  if (accomplishmentGoals.includes('clear_skin')) {
    if (saturated_fat > 8) {
      analysis.push({
        impact: "negative" as const,
        message: "High saturated fat may contribute to skin inflammation",
      });
    }
  }

  return analysis;
}

export function getScoreColor(score: number): string {
  if (score >= 75) return '#22C55E'; // Green
  if (score >= 50) return '#F59E0B'; // Yellow/Orange
  return '#EF4444'; // Red
}

export function getScoreLabel(score: number): string {
  if (score >= 75) return 'Great Choice';
  if (score >= 50) return 'Okay Choice';
  return 'Poor Choice';
}