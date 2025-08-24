import { Product } from "../types/product";

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

const AI_API_BASE = "https://toolkit.rork.com";
const GOOGLE_CLOUD_VISION_API_KEY = process.env.GOOGLE_CLOUD_VISION_API_KEY;

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
}

export type { OCRResult, IngredientAnalysis, ProductRecommendation, NutritionInsight };