import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export type Profile = {
  body_goal?: 'lose_weight' | 'gain_weight' | 'maintain_weight' | null;
  health_goals?: Array<'low_sugar' | 'high_protein' | 'low_fat' | 'keto' | 'balanced'>;
  diet_goals?: Array<'whole_foods' | 'vegan' | 'carnivore' | 'gluten_free' | 'vegetarian' | 'balanced'>;
  lifestyle_goals?: string[] | null;
};

export type ItemInput = {
  category: 'food' | 'skincare' | 'supplement';
  ingredients: string;
  nutrition?: {
    calories?: number;
    sugar_g?: number;
    added_sugar_g?: number;
    sodium_mg?: number;
    fiber_g?: number;
    protein_g?: number;
    sat_fat_g?: number;
    net_carbs_g?: number;
  };
};

export type MatchedFact = {
  target: string;
  weight: number;
  reason: string;
  originalWeight: number;
};

export type ScoreResult = {
  rules_score: number;
  personalized_score: number;
  matchedFacts: MatchedFact[];
  appliedMultipliers: Record<string, number>;
};

type Rule = {
  id: number;
  type: 'penalty' | 'bonus';
  target: string;
  pattern: string;
  weight: number;
  category: string;
  notes: string;
};

let rulesCache: { [category: string]: Rule[] } = {};
let rulesCacheTime = 0;
const CACHE_DURATION = 15 * 60 * 1000;

async function getRules(category: string): Promise<Rule[]> {
  const now = Date.now();
  
  if (rulesCache[category] && (now - rulesCacheTime) < CACHE_DURATION) {
    return rulesCache[category];
  }
  
  const { data, error } = await supabase
    .from('rules_catalog')
    .select('*')
    .eq('category', category);
  
  if (error) {
    console.error('Error fetching rules:', error);
    return [];
  }
  
  rulesCache[category] = data || [];
  rulesCacheTime = now;
  
  return data || [];
}

function normalizeIngredients(ingredients: string): string[] {
  return ingredients
    .toLowerCase()
    .replace(/[^a-z0-9\\s-]/g, ' ')
    .split(/\\s+/)
    .filter(token => token.length > 1);
}

function matchesPattern(tokens: string[], pattern: string): boolean {
  const regex = new RegExp(pattern, 'i');
  const fullText = tokens.join(' ');
  return regex.test(fullText);
}

function getPersonalizationMultipliers(profile: Profile): Record<string, number> {
  const multipliers: Record<string, number> = {};
  
  if (profile.body_goal === 'lose_weight') {
    multipliers.added_sugar = 1.5;
    multipliers.refined_carbs = 1.5;
    multipliers.sat_fat = 1.5;
    multipliers.fiber = 1.25;
    multipliers.protein = 1.25;
  } else if (profile.body_goal === 'gain_weight') {
    multipliers.protein = 1.3;
    multipliers.nutrient_dense_whole_foods = 1.3;
    multipliers.empty_calories = 1.2;
  }
  
  if (profile.health_goals?.includes('low_sugar')) {
    multipliers.added_sugar = (multipliers.added_sugar || 1) * 1.75;
    multipliers.high_sodium = (multipliers.high_sodium || 1) * 1.75;
  }
  
  if (profile.health_goals?.includes('high_protein')) {
    multipliers.protein = (multipliers.protein || 1) * 1.5;
  }
  
  if (profile.health_goals?.includes('low_fat')) {
    multipliers.sat_fat = (multipliers.sat_fat || 1) * 1.5;
    multipliers.trans_fat = (multipliers.trans_fat || 1) * 1.5;
  }
  
  if (profile.health_goals?.includes('keto')) {
    multipliers.refined_carbs = (multipliers.refined_carbs || 1) * 2.0;
    multipliers.added_sugar = (multipliers.added_sugar || 1) * 2.0;
    multipliers.healthy_fats = (multipliers.healthy_fats || 1) * 1.2;
  }
  
  if (profile.diet_goals?.includes('whole_foods')) {
    multipliers.whole_foods = (multipliers.whole_foods || 1) * 1.4;
    multipliers.preservatives = (multipliers.preservatives || 1) * 1.3;
    multipliers.artificial_colors = (multipliers.artificial_colors || 1) * 1.3;
  }
  
  if (profile.diet_goals?.includes('vegan')) {
    multipliers.animal_products = (multipliers.animal_products || 1) * 1.7;
    multipliers.plant_protein = (multipliers.plant_protein || 1) * 1.2;
  }
  
  if (profile.diet_goals?.includes('carnivore')) {
    multipliers.plant_fillers = (multipliers.plant_fillers || 1) * 1.3;
    multipliers.animal_protein = (multipliers.animal_protein || 1) * 1.2;
  }
  
  if (profile.diet_goals?.includes('gluten_free')) {
    multipliers.gluten = (multipliers.gluten || 1) * 2.0;
    multipliers.wheat = (multipliers.wheat || 1) * 2.0;
  }
  
  if (profile.diet_goals?.includes('vegetarian')) {
    multipliers.meat = (multipliers.meat || 1) * 1.7;
    multipliers.dairy = (multipliers.dairy || 1) * 1.1;
    multipliers.eggs = (multipliers.eggs || 1) * 1.1;
    multipliers.protein = (multipliers.protein || 1) * 1.1;
  }
  
  return multipliers;
}

function applyNutritionBonuses(item: ItemInput, score: number, matchedFacts: MatchedFact[]): number {
  if (!item.nutrition) return score;
  
  const nutrition = item.nutrition;
  
  if (nutrition.fiber_g && nutrition.fiber_g >= 3) {
    const bonus = 6;
    matchedFacts.push({
      target: 'fiber',
      weight: bonus,
      reason: `High fiber content (${nutrition.fiber_g}g)`,
      originalWeight: bonus
    });
    score += bonus;
  }
  
  if (nutrition.protein_g && nutrition.protein_g >= 10) {
    const bonus = 6;
    matchedFacts.push({
      target: 'protein',
      weight: bonus,
      reason: `High protein content (${nutrition.protein_g}g)`,
      originalWeight: bonus
    });
    score += bonus;
  }
  
  if (nutrition.sodium_mg && nutrition.sodium_mg > 400) {
    const penalty = -8;
    matchedFacts.push({
      target: 'high_sodium',
      weight: penalty,
      reason: `High sodium content (${nutrition.sodium_mg}mg)`,
      originalWeight: penalty
    });
    score += penalty;
  }
  
  return score;
}

export async function scoreItem(item: ItemInput, profile: Profile = {}): Promise<ScoreResult> {
  console.log('Scoring item:', { category: item.category, ingredients: item.ingredients.substring(0, 100) + '...' });
  
  const rules = await getRules(item.category);
  console.log(`Found ${rules.length} rules for category: ${item.category}`);
  
  const tokens = normalizeIngredients(item.ingredients);
  console.log('Normalized tokens:', tokens.slice(0, 10));
  
  let rulesScore = 100;
  const matchedFacts: MatchedFact[] = [];
  
  for (const rule of rules) {
    if (matchesPattern(tokens, rule.pattern)) {
      matchedFacts.push({
        target: rule.target,
        weight: rule.weight,
        reason: rule.notes || `Matched pattern: ${rule.pattern}`,
        originalWeight: rule.weight
      });
      rulesScore += rule.weight;
      console.log(`Rule matched: ${rule.target} (${rule.weight})`);
    }
  }
  
  rulesScore = applyNutritionBonuses(item, rulesScore, matchedFacts);
  rulesScore = Math.max(0, Math.min(100, rulesScore));
  
  const multipliers = getPersonalizationMultipliers(profile);
  let personalizedScore = rulesScore;
  const appliedMultipliers: Record<string, number> = {};
  
  for (const fact of matchedFacts) {
    const multiplier = multipliers[fact.target];
    if (multiplier && multiplier !== 1) {
      const originalWeight = fact.weight;
      const newWeight = Math.round(originalWeight * multiplier);
      const adjustment = newWeight - originalWeight;
      
      personalizedScore += adjustment;
      appliedMultipliers[fact.target] = multiplier;
      fact.weight = newWeight;
      
      console.log(`Applied multiplier: ${fact.target} ${multiplier}x (${originalWeight} → ${newWeight})`);
    }
  }
  
  personalizedScore = Math.max(0, Math.min(100, personalizedScore));
  
  console.log(`Final scores: Rules=${rulesScore}, Personalized=${personalizedScore}`);
  
  return {
    rules_score: rulesScore,
    personalized_score: personalizedScore,
    matchedFacts,
    appliedMultipliers
  };
}

export function clearRulesCache() {
  rulesCache = {};
  rulesCacheTime = 0;
}