import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const rules = [
  // Food penalties
  { type: 'penalty', target: 'added_sugar', pattern: 'added sugar|high fructose corn syrup|corn syrup|cane sugar|brown sugar|raw sugar|turbinado sugar|agave nectar|maple syrup', weight: -20, category: 'food', notes: 'Added sugars penalty' },
  { type: 'penalty', target: 'seed_oils', pattern: 'soybean oil|canola oil|corn oil|cottonseed oil|sunflower oil|safflower oil|vegetable oil', weight: -10, category: 'food', notes: 'Seed oils penalty' },
  { type: 'penalty', target: 'artificial_sweeteners', pattern: 'aspartame|sucralose|acesulfame potassium|saccharin|neotame', weight: -6, category: 'food', notes: 'Artificial sweeteners penalty' },
  { type: 'penalty', target: 'high_sodium', pattern: 'sodium', weight: -8, category: 'food', notes: 'High sodium penalty (>400mg/serving)' },
  { type: 'penalty', target: 'refined_carbs', pattern: 'white flour|enriched flour|wheat flour|refined wheat|white rice', weight: -8, category: 'food', notes: 'Refined carbohydrates penalty' },
  { type: 'penalty', target: 'trans_fat', pattern: 'partially hydrogenated|trans fat|hydrogenated oil', weight: -15, category: 'food', notes: 'Trans fats penalty' },
  { type: 'penalty', target: 'artificial_colors', pattern: 'red 40|yellow 5|yellow 6|blue 1|blue 2|red 3|caramel color', weight: -5, category: 'food', notes: 'Artificial colors penalty' },
  { type: 'penalty', target: 'preservatives', pattern: 'sodium benzoate|potassium sorbate|bht|bha|tbhq', weight: -4, category: 'food', notes: 'Chemical preservatives penalty' },
  
  // Food bonuses
  { type: 'bonus', target: 'fiber', pattern: 'fiber', weight: 6, category: 'food', notes: 'High fiber bonus (≥3g)' },
  { type: 'bonus', target: 'protein', pattern: 'protein', weight: 6, category: 'food', notes: 'High protein bonus (≥10g)' },
  { type: 'bonus', target: 'whole_foods', pattern: '^[a-z\\s]+$', weight: 12, category: 'food', notes: 'Single-ingredient whole foods bonus' },
  { type: 'bonus', target: 'omega3', pattern: 'omega-3|dha|epa|flaxseed|chia seed|walnuts|salmon|sardines', weight: 8, category: 'food', notes: 'Omega-3 fatty acids bonus' },
  { type: 'bonus', target: 'probiotics', pattern: 'lactobacillus|bifidobacterium|probiotics|live cultures', weight: 6, category: 'food', notes: 'Probiotics bonus' },
  { type: 'bonus', target: 'antioxidants', pattern: 'blueberries|cranberries|pomegranate|green tea|dark chocolate|vitamin c|vitamin e', weight: 4, category: 'food', notes: 'Antioxidants bonus' },
  
  // Skincare penalties
  { type: 'penalty', target: 'parabens', pattern: 'methylparaben|ethylparaben|propylparaben|butylparaben|isobutylparaben', weight: -15, category: 'skincare', notes: 'Parabens penalty' },
  { type: 'penalty', target: 'phthalates', pattern: 'phthalate|dbp|dehp|dep|bbp', weight: -12, category: 'skincare', notes: 'Phthalates penalty' },
  { type: 'penalty', target: 'synthetic_fragrance', pattern: 'fragrance|parfum|synthetic fragrance', weight: -10, category: 'skincare', notes: 'Synthetic fragrance penalty' },
  { type: 'penalty', target: 'formaldehyde_releasers', pattern: 'dmdm hydantoin|imidazolidinyl urea|diazolidinyl urea|quaternium-15|bronopol', weight: -15, category: 'skincare', notes: 'Formaldehyde releasers penalty' },
  { type: 'penalty', target: 'oxybenzone', pattern: 'oxybenzone|benzophenone-3', weight: -12, category: 'skincare', notes: 'Oxybenzone penalty' },
  { type: 'penalty', target: 'sulfates', pattern: 'sodium lauryl sulfate|sodium laureth sulfate|sls|sles', weight: -8, category: 'skincare', notes: 'Harsh sulfates penalty' },
  { type: 'penalty', target: 'alcohol', pattern: 'denatured alcohol|alcohol denat|isopropyl alcohol', weight: -6, category: 'skincare', notes: 'Drying alcohols penalty' },
  
  // Skincare bonuses
  { type: 'bonus', target: 'soothing_botanicals', pattern: 'aloe vera|calendula|chamomile|green tea|oat|colloidal oatmeal', weight: 6, category: 'skincare', notes: 'Soothing botanicals bonus' },
  { type: 'bonus', target: 'niacinamide', pattern: 'niacinamide|nicotinamide', weight: 6, category: 'skincare', notes: 'Niacinamide bonus' },
  { type: 'bonus', target: 'ceramides', pattern: 'ceramide|squalane|squalene', weight: 8, category: 'skincare', notes: 'Ceramides and squalane bonus' },
  { type: 'bonus', target: 'non_comedogenic_oils', pattern: 'jojoba oil|argan oil|rosehip oil|marula oil', weight: 6, category: 'skincare', notes: 'Non-comedogenic oils bonus' },
  { type: 'bonus', target: 'hyaluronic_acid', pattern: 'hyaluronic acid|sodium hyaluronate', weight: 6, category: 'skincare', notes: 'Hyaluronic acid bonus' },
  { type: 'bonus', target: 'vitamin_c', pattern: 'ascorbic acid|magnesium ascorbyl phosphate|sodium ascorbyl phosphate', weight: 6, category: 'skincare', notes: 'Vitamin C bonus' },
  { type: 'bonus', target: 'retinoids', pattern: 'retinol|retinyl palmitate|retinaldehyde|tretinoin', weight: 8, category: 'skincare', notes: 'Retinoids bonus' },
  
  // Supplement penalties
  { type: 'penalty', target: 'artificial_fillers', pattern: 'microcrystalline cellulose|silicon dioxide|magnesium stearate|titanium dioxide', weight: -4, category: 'supplement', notes: 'Artificial fillers penalty' },
  { type: 'penalty', target: 'artificial_colors_suppl', pattern: 'fd&c|artificial color|red 40|yellow 5|blue 1', weight: -6, category: 'supplement', notes: 'Artificial colors in supplements penalty' },
  { type: 'penalty', target: 'synthetic_vitamins', pattern: 'dl-alpha tocopherol|cyanocobalamin|folic acid', weight: -3, category: 'supplement', notes: 'Synthetic vitamins penalty' },
  
  // Supplement bonuses
  { type: 'bonus', target: 'whole_food_vitamins', pattern: 'whole food|organic|natural|plant-based|fermented', weight: 8, category: 'supplement', notes: 'Whole food vitamins bonus' },
  { type: 'bonus', target: 'third_party_tested', pattern: 'third party tested|nsf certified|usp verified|informed choice', weight: 6, category: 'supplement', notes: 'Third party testing bonus' },
  { type: 'bonus', target: 'bioavailable_forms', pattern: 'methylcobalamin|folate|d-alpha tocopherol|chelated|bisglycinate', weight: 6, category: 'supplement', notes: 'Bioavailable forms bonus' }
];

async function seedRules() {
  console.log('🌱 Seeding rules catalog...');
  
  try {
    // Clear existing rules
    const { error: deleteError } = await supabase
      .from('rules_catalog')
      .delete()
      .neq('id', 0); // Delete all
    
    if (deleteError) {
      console.warn('Warning clearing existing rules:', deleteError.message);
    }
    
    // Insert new rules
    const { data, error } = await supabase
      .from('rules_catalog')
      .insert(rules)
      .select();
    
    if (error) {
      console.error('❌ Error seeding rules:', error);
      process.exit(1);
    }
    
    console.log(`✅ Successfully seeded ${data?.length || 0} rules`);
    console.log('Rules by category:');
    
    const categories = ['food', 'skincare', 'supplement'];
    for (const category of categories) {
      const categoryRules = rules.filter(r => r.category === category);
      const penalties = categoryRules.filter(r => r.type === 'penalty').length;
      const bonuses = categoryRules.filter(r => r.type === 'bonus').length;
      console.log(`  ${category}: ${penalties} penalties, ${bonuses} bonuses`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

seedRules();