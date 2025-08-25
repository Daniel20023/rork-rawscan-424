import { Product } from "../types/product";
import { Profile, ItemInput, MatchedFact, ScoreResult } from './ScoringService';

type AIMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: 'text' | 'image'; text?: string; image?: string }>;
};

type OCRResult = {
  success: boolean;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    servingSize?: string;
    servingsPerContainer?: number;
  };
  ingredients?: string[];
  error?: string;
};

type IngredientAnalysis = {
  harmful: Array<{
    ingredient: string;
    reason: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  beneficial: Array<{
    ingredient: string;
    reason: string;
  }>;
  summary: string;
};

type ProductRecommendation = {
  reason: string;
  alternatives: Array<{
    name: string;
    brand?: string;
    score: number;
    whyBetter: string;
  }>;
};

type NutritionInsight = {
  overallAssessment: string;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  scoreExplanation: string;
};

type AIExplanation = {
  verdict: 'Green' | 'Yellow' | 'Red';
  headline: string;
  why: string[];
  swaps: Array<{
    name: string;
    why: string;
    link?: string | null;
    score_hint?: number;
  }>;
  disclaimer: string;
};

const AI_API_BASE = "https://toolkit.rork.com";
const GOOGLE_CLOUD_VISION_API_KEY = process.env.GOOGLE_CLOUD_VISION_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

function getVerdictFromScore(score: number): 'Green' | 'Yellow' | 'Red' {
  if (score >= 80) return 'Green';
  if (score >= 60) return 'Yellow';
  return 'Red';
}

export class AIService {
  private static async callAI(messages: AIMessage[]): Promise<string> {
    try {
      const response = await fetch(`${AI_API_BASE}/text/llm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.completion;
    } catch (error) {
      console.error('AI API call failed:', error);
      throw error;
    }
  }

  private static async callGoogleVisionOCR(imageBase64: string): Promise<string> {
    if (!GOOGLE_CLOUD_VISION_API_KEY) {
      throw new Error('Google Cloud Vision API key not configured');
    }

    try {
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: imageBase64,
                },
                features: [
                  {
                    type: 'TEXT_DETECTION',
                    maxResults: 1,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Google Vision API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.responses?.[0]?.textAnnotations?.[0]?.description) {
        return data.responses[0].textAnnotations[0].description;
      }
      
      throw new Error('No text detected in image');
    } catch (error) {
      console.error('Google Vision OCR failed:', error);
      throw error;
    }
  }

  static async extractNutritionFromImage(imageBase64: string): Promise<OCRResult> {
    try {
      // Step 1: Use Google Cloud Vision for OCR
      const ocrText = await this.callGoogleVisionOCR(imageBase64);
      console.log('Google Vision OCR result:', ocrText);
      
      // Step 2: Use AI to parse the OCR text into structured nutrition data
      const messages: AIMessage[] = [
        {
          role: 'system',
          content: `You are an expert at parsing nutrition labels from OCR text. 

Extract the following information from the OCR text and return it as valid JSON:
{
  "success": true,
  "nutrition": {
    "calories": number (per serving),
    "protein": number (grams per serving),
    "carbohydrates": number (grams per serving),
    "fat": number (grams per serving),
    "fiber": number (grams per serving),
    "sugar": number (grams per serving),
    "sodium": number (mg per serving),
    "servingSize": "string description",
    "servingsPerContainer": number
  },
  "ingredients": ["ingredient1", "ingredient2", ...]
}

If you cannot parse the nutrition information clearly, return: {"success": false, "error": "Could not parse nutrition label clearly"}

Only include nutrients that are clearly visible. Use null for missing values.`
        },
        {
          role: 'user',
          content: `Please extract the nutrition information and ingredients from this OCR text:\n\n${ocrText}`
        }
      ];

      const result = await this.callAI(messages);
      
      try {
        const parsed = JSON.parse(result);
        return parsed;
      } catch (parseError) {
        console.error('Failed to parse AI response:', result);
        return {
          success: false,
          error: 'Failed to parse nutrition information from OCR text'
        };
      }
    } catch (error) {
      console.error('OCR extraction failed:', error);
      return {
        success: false,
        error: 'Failed to process image'
      };
    }
  }

  static async analyzeIngredients(ingredients: string[], userPreferences: any): Promise<IngredientAnalysis> {
    try {
      const dietType = userPreferences.diet_type || 'balanced';
      const healthGoals = userPreferences.health_goals || [];
      const avoidIngredients = userPreferences.avoid_ingredients || [];

      const messages: AIMessage[] = [
        {
          role: 'system',
          content: `You are a nutrition expert analyzing food ingredients for health impact.

User preferences:
- Diet type: ${dietType}
- Health goals: ${healthGoals.join(', ')}
- Ingredients to avoid: ${avoidIngredients.join(', ')}

Analyze the ingredients and return JSON:
{
  "harmful": [
    {
      "ingredient": "ingredient name",
      "reason": "why it's concerning",
      "severity": "low|medium|high"
    }
  ],
  "beneficial": [
    {
      "ingredient": "ingredient name",
      "reason": "why it's good"
    }
  ],
  "summary": "2-3 sentence overall assessment"
}

Focus on:
- Artificial additives, preservatives, colors
- Seed oils, trans fats
- Added sugars, artificial sweeteners
- Allergens and dietary restrictions
- Beneficial whole food ingredients`
        },
        {
          role: 'user',
          content: `Analyze these ingredients: ${ingredients.join(', ')}`
        }
      ];

      const result = await this.callAI(messages);
      return JSON.parse(result);
    } catch (error) {
      console.error('Ingredient analysis failed:', error);
      return {
        harmful: [],
        beneficial: [],
        summary: 'Unable to analyze ingredients at this time.'
      };
    }
  }

  static async generateProductRecommendations(
    currentProduct: Product,
    userPreferences: any,
    score: number
  ): Promise<ProductRecommendation> {
    try {
      const messages: AIMessage[] = [
        {
          role: 'system',
          content: `You are a nutrition expert providing product recommendations.

User preferences:
- Diet: ${userPreferences.diet_type || 'balanced'}
- Health goals: ${(userPreferences.health_goals || []).join(', ')}
- Body goal: ${userPreferences.body_goal || 'maintain'}

The current product scored ${score}/100. If score < 70, suggest better alternatives.

Return JSON:
{
  "reason": "why user might want alternatives",
  "alternatives": [
    {
      "name": "product name",
      "brand": "brand name",
      "score": estimated_score,
      "whyBetter": "specific improvements"
    }
  ]
}

If score >= 70, return empty alternatives array and positive reason.`
        },
        {
          role: 'user',
          content: `Current product: ${currentProduct.name} by ${currentProduct.brand || 'Unknown'}
Ingredients: ${currentProduct.ingredientsText || 'Not available'}
Score: ${score}/100

Suggest alternatives if needed.`
        }
      ];

      const result = await this.callAI(messages);
      return JSON.parse(result);
    } catch (error) {
      console.error('Recommendation generation failed:', error);
      return {
        reason: 'Unable to generate recommendations at this time.',
        alternatives: []
      };
    }
  }

  static async generateNutritionInsights(
    product: Product,
    score: number,
    userPreferences: any
  ): Promise<NutritionInsight> {
    try {
      const messages: AIMessage[] = [
        {
          role: 'system',
          content: `You are a nutrition expert providing personalized insights.

User profile:
- Diet: ${userPreferences.diet_type || 'balanced'}
- Health goals: ${(userPreferences.health_goals || []).join(', ')}
- Body goal: ${userPreferences.body_goal || 'maintain'}

Analyze the product and return JSON:
{
  "overallAssessment": "2-3 sentence summary",
  "strengths": ["positive aspect 1", "positive aspect 2"],
  "concerns": ["concern 1", "concern 2"],
  "recommendations": ["actionable tip 1", "actionable tip 2"],
  "scoreExplanation": "why it got this score"
}

Be specific about nutrition values and ingredients.`
        },
        {
          role: 'user',
          content: `Product: ${product.name}
Brand: ${product.brand || 'Unknown'}
Calories: ${product.nutriments.energyKcal || 'N/A'} per ${product.nutritionBasis === 'per_serving' ? 'serving' : '100g'}
Protein: ${product.nutriments.protein || 'N/A'}g
Carbs: ${product.nutriments.carbohydrates || 'N/A'}g
Fat: ${product.nutriments.fat || 'N/A'}g
Sugar: ${product.nutriments.sugars || 'N/A'}g
Fiber: ${product.nutriments.fiber || 'N/A'}g
Sodium: ${product.nutriments.sodium || 'N/A'}g
Ingredients: ${product.ingredientsText || 'Not available'}
Score: ${score}/100`
        }
      ];

      const result = await this.callAI(messages);
      return JSON.parse(result);
    } catch (error) {
      console.error('Nutrition insights generation failed:', error);
      return {
        overallAssessment: 'Unable to generate detailed insights at this time.',
        strengths: [],
        concerns: [],
        recommendations: [],
        scoreExplanation: `This product received a score of ${score}/100 based on your preferences.`
      };
    }
  }

  static async generateImageFromPrompt(prompt: string, size: string = '1024x1024'): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    try {
      const response = await fetch(`${AI_API_BASE}/images/generate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, size }),
      });

      if (!response.ok) {
        throw new Error(`Image generation API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Convert base64 to data URL
      const imageUrl = `data:${data.image.mimeType};base64,${data.image.base64Data}`;
      
      return {
        success: true,
        imageUrl
      };
    } catch (error) {
      console.error('Image generation failed:', error);
      return {
        success: false,
        error: 'Failed to generate image'
      };
    }
  }

  static async generateExplanation(
    profile: Profile,
    item: ItemInput,
    scoreResult: ScoreResult
  ): Promise<AIExplanation> {
    console.log('🤖 Generating AI explanation...');
    
    if (!OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API key not available, returning fallback explanation');
      return this.createFallbackExplanation(scoreResult);
    }
    
    try {
      const systemPrompt = this.createSystemPrompt();
      const userPrompt = this.createUserPrompt(profile, item, scoreResult);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 800,
          response_format: { type: 'json_object' }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        return this.createFallbackExplanation(scoreResult);
      }
      
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        console.error('No content in OpenAI response');
        return this.createFallbackExplanation(scoreResult);
      }
      
      const explanation = JSON.parse(content) as AIExplanation;
      
      // Validate the response structure
      if (!explanation.verdict || !explanation.headline || !explanation.why || !explanation.swaps) {
        console.error('Invalid AI response structure');
        return this.createFallbackExplanation(scoreResult);
      }
      
      console.log('✅ AI explanation generated successfully');
      return explanation;
      
    } catch (error) {
      console.error('Error generating AI explanation:', error);
      return this.createFallbackExplanation(scoreResult);
    }
  }

  private static createSystemPrompt(): string {
    return `You are an expert health and wellness advisor analyzing product ingredients and nutrition.

You receive:
- User goals: body_goal, health_goals[], diet_goals[] (lifestyle_goals are tracked only and DO NOT affect scoring)
- An item's ingredients/nutrition data
- Deterministic rules_score and personalized_score from our scoring engine
- Matched rule hits and applied multipliers

Your task:
1. Map personalized_score to verdict: ≥80 Green; 60-79 Yellow; else Red
2. Create a compelling headline (≤80 chars) that captures the essence
3. Explain in ≤3 short, actionable bullets why this score makes sense
4. Suggest 2-3 practical swaps aligned with user goals

IMPORTANT:
- Do NOT fabricate nutrition data - if missing, say "Limited data—using best estimate"
- Focus on the most impactful factors from the matched rules
- Swaps should be realistic alternatives, not medical advice
- Return STRICT JSON matching the schema

Return JSON in this exact format:
{
  "verdict": "Green|Yellow|Red",
  "headline": "string (≤80 chars)",
  "why": ["bullet 1", "bullet 2", "bullet 3"],
  "swaps": [{"name": "string", "why": "string", "link": null, "score_hint": 85}],
  "disclaimer": "Wellness guidance only; not medical advice."
}`;
  }

  private static createUserPrompt(
    profile: Profile,
    item: ItemInput,
    scoreResult: ScoreResult
  ): string {
    const { rules_score, personalized_score, matchedFacts, appliedMultipliers } = scoreResult;
    
    return `ANALYSIS REQUEST:

User Profile:
- Body Goal: ${profile.body_goal || 'maintain_weight'}
- Health Goals: ${profile.health_goals?.join(', ') || 'balanced'}
- Diet Goals: ${profile.diet_goals?.join(', ') || 'balanced'}
- Lifestyle Goals: ${profile.lifestyle_goals?.join(', ') || 'none'} (tracked only, not used in scoring)

Product:
- Category: ${item.category}
- Ingredients: ${item.ingredients}
- Nutrition: ${item.nutrition ? JSON.stringify(item.nutrition) : 'Not provided'}

Scoring Results:
- Rules Score: ${rules_score}/100
- Personalized Score: ${personalized_score}/100
- Verdict: ${getVerdictFromScore(personalized_score)}

Matched Rules (${matchedFacts.length}):
${matchedFacts.map(fact => 
  `- ${fact.target}: ${fact.weight} points (${fact.reason})`
).join('\n')}

Applied Multipliers:
${Object.entries(appliedMultipliers).map(([target, multiplier]) => 
  `- ${target}: ${multiplier}x multiplier`
).join('\n') || 'None'}

Please provide your analysis as JSON.`;
  }

  private static createFallbackExplanation(scoreResult: ScoreResult): AIExplanation {
    const { personalized_score, matchedFacts } = scoreResult;
    const verdict = getVerdictFromScore(personalized_score);
    
    const positiveFactsCount = matchedFacts.filter(f => f.weight > 0).length;
    const negativeFactsCount = matchedFacts.filter(f => f.weight < 0).length;
    
    let headline: string;
    let why: string[];
    
    if (verdict === 'Green') {
      headline = `Great choice! Score: ${personalized_score}/100`;
      why = [
        `Found ${positiveFactsCount} beneficial ingredients`,
        negativeFactsCount > 0 ? `Only ${negativeFactsCount} minor concerns` : 'No major red flags detected',
        'Aligns well with your health goals'
      ];
    } else if (verdict === 'Yellow') {
      headline = `Decent option with room for improvement (${personalized_score}/100)`;
      why = [
        `Mixed bag: ${positiveFactsCount} positives, ${negativeFactsCount} negatives`,
        'Some ingredients could be better',
        'Consider alternatives when possible'
      ];
    } else {
      headline = `Consider alternatives - Score: ${personalized_score}/100`;
      why = [
        `Found ${negativeFactsCount} concerning ingredients`,
        positiveFactsCount > 0 ? `Only ${positiveFactsCount} redeeming qualities` : 'Few beneficial ingredients',
        'Better options likely available'
      ];
    }
    
    const swaps = [
      {
        name: 'Whole food alternative',
        why: 'Look for single-ingredient or minimally processed options',
        link: null,
        score_hint: Math.min(95, personalized_score + 20)
      },
      {
        name: 'Organic version',
        why: 'Organic products typically have fewer synthetic additives',
        link: null,
        score_hint: Math.min(90, personalized_score + 15)
      }
    ];
    
    return {
      verdict,
      headline,
      why: why.slice(0, 3),
      swaps,
      disclaimer: 'Wellness guidance only; not medical advice.'
    };
  }
}

export type { OCRResult, IngredientAnalysis, ProductRecommendation, NutritionInsight, AIExplanation };