export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: "nutrition" | "ingredients" | "scoring" | "tips";
  readTime: number;
  image: string;
}

export const articles: Article[] = [
  {
    id: "understanding-nutrition-labels",
    title: "Understanding Nutrition Labels",
    summary: "Learn how to read and interpret nutrition facts on food packaging.",
    category: "nutrition",
    readTime: 5,
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
    content: `# Understanding Nutrition Labels

Nutrition labels are your roadmap to making healthier food choices. Here's what you need to know:

## Serving Size
Always check the serving size first - all nutritional information is based on this amount. Many packages contain multiple servings.

## Calories
This tells you how much energy you get from one serving. For weight management:
- 40 calories = low
- 100 calories = moderate  
- 400+ calories = high

## Key Nutrients to Watch

### Limit These:
- **Saturated Fat**: Less than 10% of daily calories
- **Sodium**: Less than 2,300mg per day
- **Added Sugars**: Less than 10% of daily calories

### Get Enough Of:
- **Fiber**: 25-35g per day
- **Protein**: 0.8g per kg of body weight
- **Vitamins & Minerals**: Aim for 100% Daily Value

## % Daily Value (%DV)
- 5% or less = low
- 20% or more = high

Use this as a quick guide to see if a food is high or low in a nutrient.`
  },
  {
    id: "food-additives-explained",
    title: "Food Additives Explained",
    summary: "Decode the E-numbers and chemical names in your food ingredients.",
    category: "ingredients",
    readTime: 7,
    image: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400",
    content: `# Food Additives Explained

Food additives can seem scary, but understanding them helps you make informed choices.

## What Are Food Additives?

Additives are substances added to food to:
- Preserve freshness
- Enhance flavor or appearance
- Improve texture
- Add nutritional value

## Common Additives & Their Effects

### Preservatives
- **E200-E299**: Generally safe, prevent spoilage
- **Sodium Benzoate (E211)**: Safe in small amounts
- **Potassium Sorbate (E202)**: Well-tolerated preservative

### Colorings
- **Natural colors**: Usually safer options
- **Artificial colors**: Some linked to hyperactivity in children
- **E102 (Tartrazine)**: May cause reactions in sensitive individuals

### Flavor Enhancers
- **MSG (E621)**: Safe for most people, may cause headaches in some
- **Natural flavors**: Can be complex chemical compounds

## Red Flags to Watch For
- **Trans fats**: Avoid completely
- **High fructose corn syrup**: Limit intake
- **Artificial sweeteners**: Moderate consumption

## Reading Ingredient Lists
Ingredients are listed by weight, so the first few ingredients make up most of the product. Choose foods with:
- Recognizable ingredients
- Shorter ingredient lists
- Whole foods listed first`
  },
  {
    id: "health-scoring-system",
    title: "How Our Health Scoring Works",
    summary: "Understand how we calculate health scores for different products.",
    category: "scoring",
    readTime: 4,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400",
    content: `# How Our Health Scoring Works

Our health scoring system evaluates products on a scale of 0-100, considering multiple factors.

## Base Score Calculation

### Positive Factors (+points)
- **High Protein**: +10-20 points
- **High Fiber**: +10-15 points
- **Low Saturated Fat**: +5-10 points
- **No Additives**: +5-15 points

### Negative Factors (-points)
- **High Sugar**: -10-25 points
- **High Sodium**: -10-20 points
- **High Saturated Fat**: -5-15 points
- **Harmful Additives**: -5-20 points

## Personal Adjustments

The score is then adjusted based on your goals:

### Weight Loss Goals
- Lower calorie foods get bonus points
- High fiber foods get extra credit
- High sugar foods penalized more

### Muscle Building Goals
- High protein foods get significant bonuses
- Moderate calorie foods preferred
- Post-workout timing considered

### Health Conditions
- Diabetes: Sugar content heavily weighted
- Heart disease: Sodium and saturated fat focus
- Digestive issues: Fiber and additives considered

## Score Ranges
- **80-100**: Excellent choice
- **60-79**: Good option
- **40-59**: Moderate - consume occasionally  
- **20-39**: Poor choice
- **0-19**: Avoid if possible

Remember: No single score tells the whole story. Consider your overall diet pattern!`
  },
  {
    id: "smart-shopping-tips",
    title: "Smart Shopping Tips",
    summary: "Practical advice for making healthier choices at the grocery store.",
    category: "tips",
    readTime: 6,
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400",
    content: `# Smart Shopping Tips

Transform your grocery shopping with these evidence-based strategies.

## Before You Shop

### Plan Your Meals
- Create a weekly meal plan
- Make a shopping list organized by store sections
- Eat before shopping to avoid impulse purchases

### Set Your Budget
- Healthy eating doesn't have to be expensive
- Focus on seasonal produce
- Buy generic brands for staples

## At the Store

### Shop the Perimeter First
- Fresh produce, dairy, meat, and seafood are usually around the edges
- Fill your cart with whole foods first
- Then venture into aisles for specific items

### Read Labels Strategically
- Check serving sizes first
- Look for short ingredient lists
- Avoid products with sugar in the first 3 ingredients

## Product Selection Tips

### Produce Section
- Choose a variety of colors
- Buy seasonal fruits and vegetables
- Don't fear frozen - often more nutritious than "fresh"

### Packaged Foods
- Compare similar products
- Look for whole grain options
- Check sodium content in canned goods

### Protein Sources
- Vary your protein types
- Choose lean cuts of meat
- Consider plant-based options

## Money-Saving Strategies

### Buy in Bulk
- Grains, legumes, and nuts
- Freeze portions you won't use immediately
- Check unit prices, not package prices

### Use Technology
- Compare prices with apps
- Look for digital coupons
- Check store loyalty programs

## Red Flags to Avoid
- Health claims on front of package (check the back!)
- Products with more than 10 ingredients
- Anything you can't pronounce (unless you research it)

Remember: The best diet is one you can stick to long-term!`
  },
  {
    id: "sugar-hidden-sources",
    title: "Hidden Sources of Sugar",
    summary: "Discover where sugar hides in everyday foods and how to spot it.",
    category: "ingredients",
    readTime: 5,
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400",
    content: `# Hidden Sources of Sugar

Sugar isn't just in candy and desserts. Learn to identify its many disguises.

## Sugar's Many Names

Sugar appears on ingredient lists under dozens of names:

### Obvious Names
- Sugar, brown sugar, raw sugar
- Honey, maple syrup, agave nectar
- Molasses, corn syrup

### Sneaky Names
- Dextrose, fructose, glucose, sucrose
- Maltodextrin, dextrin
- Barley malt, rice syrup
- Fruit juice concentrate

## Unexpected Sugar Sources

### Savory Foods
- **Pasta sauce**: 6-12g per serving
- **Salad dressing**: 2-6g per tablespoon  
- **Bread**: 1-3g per slice
- **Crackers**: 1-4g per serving

### "Healthy" Foods
- **Yogurt**: 15-25g per cup (flavored)
- **Granola**: 6-12g per serving
- **Protein bars**: 10-20g per bar
- **Smoothies**: 25-40g per serving

### Condiments & Sauces
- **Ketchup**: 4g per tablespoon
- **BBQ sauce**: 6-12g per tablespoon
- **Teriyaki sauce**: 8-15g per tablespoon

## Reading Labels for Sugar

### Check Total Sugars
- Includes both natural and added sugars
- Natural sugars (from fruit/milk) are less concerning

### Look for Added Sugars
- New labels show this separately
- Aim for less than 25g added sugar per day

### Ingredient Order Matters
- Ingredients listed by weight
- Multiple sugar sources can add up
- Watch for sugar in first 5 ingredients

## Reducing Sugar Intake

### Smart Swaps
- Plain yogurt + fresh fruit instead of flavored
- Sparkling water + lemon instead of soda
- Homemade dressing instead of bottled

### Gradual Reduction
- Cut back slowly to retrain taste buds
- Use spices and herbs for flavor
- Choose unsweetened versions when possible

## Daily Sugar Limits
- **Women**: 25g (6 teaspoons) added sugar
- **Men**: 36g (9 teaspoons) added sugar
- **Children**: 12-25g depending on age

Remember: Your taste buds adapt! Reducing sugar gradually makes healthy foods taste better over time.`
  },
  {
    id: "protein-complete-guide",
    title: "Complete Guide to Protein",
    summary: "Everything you need to know about protein for optimal health.",
    category: "nutrition",
    readTime: 8,
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400",
    content: `# Complete Guide to Protein

Protein is essential for building and repairing tissues, making enzymes, and supporting immune function.

## Why Protein Matters

### Key Functions
- **Muscle building and repair**
- **Enzyme and hormone production**
- **Immune system support**
- **Energy source (when needed)**

### Daily Needs
- **Sedentary adults**: 0.8g per kg body weight
- **Active individuals**: 1.2-1.6g per kg
- **Athletes**: 1.6-2.2g per kg
- **Older adults**: 1.0-1.2g per kg

## Complete vs Incomplete Proteins

### Complete Proteins
Contain all 9 essential amino acids:
- **Animal sources**: Meat, fish, eggs, dairy
- **Plant sources**: Quinoa, soy, hemp seeds, chia seeds

### Incomplete Proteins
Missing one or more essential amino acids:
- **Grains**: Rice, wheat, oats
- **Legumes**: Beans, lentils, peas
- **Nuts and seeds**: Most varieties

## Protein Combining

You don't need to combine proteins at every meal, but pairing throughout the day helps:

### Classic Combinations
- **Rice + beans**: Complete amino acid profile
- **Peanut butter + whole grain bread**
- **Hummus + pita bread**
- **Lentils + nuts/seeds**

## High-Quality Protein Sources

### Animal-Based (per 100g)
- **Chicken breast**: 31g protein
- **Salmon**: 25g protein
- **Eggs**: 13g protein
- **Greek yogurt**: 10g protein

### Plant-Based (per 100g cooked)
- **Lentils**: 9g protein
- **Quinoa**: 4.4g protein
- **Tofu**: 8g protein
- **Hemp seeds**: 31g protein

## Protein Timing

### Throughout the Day
- Aim for 20-30g protein per meal
- Include protein in snacks
- Spread intake evenly

### Post-Workout
- Consume within 2 hours of exercise
- 20-25g high-quality protein optimal
- Combine with carbohydrates for recovery

## Signs of Protein Deficiency
- Muscle weakness or loss
- Slow wound healing
- Frequent infections
- Hair, skin, or nail problems
- Fatigue and weakness

## Protein Quality Factors

### Digestibility
- Animal proteins: 90-95% digestible
- Plant proteins: 70-90% digestible
- Processing can affect digestibility

### Amino Acid Score
- Measures protein quality
- Higher scores indicate better amino acid profiles
- Combine different sources for optimal intake

Remember: Most people in developed countries get enough protein, but athletes and older adults may need more focus on intake and timing.`
  }
];

export const faqs = [
  {
    question: "How accurate are the health scores?",
    answer: "Our health scores are based on established nutritional guidelines and research. However, they're meant as a general guide - individual needs vary based on health conditions, activity level, and personal goals. Always consult healthcare providers for personalized advice."
  },
  {
    question: "Why do some 'healthy' foods get low scores?",
    answer: "Our scoring considers multiple factors including calories, sugar, sodium, and additives. Some foods marketed as healthy may be high in sugar or sodium. Remember to look at your overall diet pattern, not just individual scores."
  },
  {
    question: "Can I trust products with high scores?",
    answer: "High scores indicate better nutritional profiles, but consider portion sizes and your individual needs. A high-score food eaten in excess can still impact your health goals."
  },
  {
    question: "How often should I scan products?",
    answer: "Scan new products when shopping to build awareness. Over time, you'll develop intuition for healthier choices and may scan less frequently."
  },
  {
    question: "What if a product isn't in your database?",
    answer: "We're constantly expanding our database. For unlisted products, focus on reading the nutrition label and ingredient list using the principles you've learned."
  },
  {
    question: "Are all additives bad?",
    answer: "No! Many additives are safe and necessary for food preservation. Our app flags potentially concerning additives, but most are well-tested and safe in normal amounts."
  },
  {
    question: "How do I set realistic health goals?",
    answer: "Start small and be specific. Instead of 'eat healthier,' try 'include one serving of vegetables with lunch.' Gradual changes are more sustainable than dramatic overhauls."
  },
  {
    question: "Should I avoid all processed foods?",
    answer: "Not necessarily. Some processing (like freezing vegetables) can be beneficial. Focus on minimally processed foods and read labels on packaged items to make informed choices."
  }
];