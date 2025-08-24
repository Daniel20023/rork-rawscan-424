import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  X, 
  Heart, 
  AlertCircle,
  ShoppingCart,
  Package,
  Droplet,
  Fish,
  Wheat,
  Zap,
  ChevronDown,
  Brain,
  Camera
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { useProductHistory } from "@/contexts/ProductHistoryContext";
import { useProduct } from "@/hooks/useProduct";
import { scoreProduct, getScoreLabel } from "@/utils/scoring";
import { Colors } from "@/constants/colors";
import { trpc } from "@/lib/trpc";
import NutritionCamera from "@/components/NutritionCamera";

export default function ProductDetailScreen() {
  const { barcode } = useLocalSearchParams<{ barcode: string }>();
  const userPreferences = useUserPreferences();
  const { favorites, addToFavorites, removeFromFavorites, history } = useProductHistory();
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const nutritionInsightsMutation = trpc.ai.insights.useMutation();
  const ocrMutation = trpc.ai.ocr.useMutation();
  
  // Get product from API with user profile for personalized scoring
  const userProfile = {
    user_id: 'anonymous',
    body_goal: userPreferences.body_goal || 'maintain_weight',
    health_goals: userPreferences.health_goals || [],
    diet_type: userPreferences.diet_type || 'balanced',
    avoid_ingredients: userPreferences.avoid_ingredients || [],
    strictness: {
      diet_type: 0.7,
      health_goals: 0.8
    },
    accomplish_future: userPreferences.accomplish_future || []
  };
  
  const { data: productResponse, isLoading, error } = useProduct(barcode || '');
  
  // Debug logging
  console.log('Product query state:', {
    barcode,
    isLoading,
    hasError: !!error,
    errorMessage: error?.message,
    hasData: !!productResponse,
    dataOk: productResponse?.ok
  });
  
  // Get scoring information from history if available
  const historyItem = history.find(item => item.barcode === barcode);
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (error || !productResponse?.ok || !productResponse.product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error ? `Error: ${error.message}` : 'Product not found'}
          </Text>
          {error && (
            <Text style={styles.errorText}>
              {JSON.stringify({
                code: error.data?.code,
                httpStatus: error.data?.httpStatus,
                path: error.data?.path
              }, null, 2)}
            </Text>
          )}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const product = productResponse.product;
  const isFavorite = favorites.some(fav => fav.barcode === barcode);
  
  // Use score from history or calculate locally (personalized scoring temporarily disabled)
  let score = historyItem?.score;
  let reasons = historyItem?.reasons || [];
  
  if (!score) {
    const localUserProfile = {
      name: userPreferences.name || 'User',
      gender: userPreferences.gender,
      bodyGoals: userPreferences.body_goal ? [userPreferences.body_goal] : [],
      healthGoals: userPreferences.health_goals || [],
      dietGoals: userPreferences.diet_type ? [userPreferences.diet_type] : [],
      accomplishmentGoals: userPreferences.accomplish_future || [],
      hasCompletedOnboarding: userPreferences.hasCompletedOnboarding || false,
      profilePicture: userPreferences.profilePicture
    };
    
    const scoringResult = scoreProduct(product, localUserProfile);
    score = scoringResult.final_score;
    reasons = [];
  }
  
  const getScoreGradient = (): [string, string] => {
    if ((score || 0) >= 75) return ['#22C55E', '#16A34A']; // Green gradient
    if ((score || 0) >= 50) return ['#F59E0B', '#F97316']; // Orange gradient  
    return ['#EF4444', '#DC2626']; // Red gradient
  };

  const getScoreEmoji = () => {
    if ((score || 0) >= 75) return "😊";
    if ((score || 0) >= 50) return "😐";
    return "😟";
  };

  const getScoreMessage = () => {
    const label = getScoreLabel(score || 0);
    if ((score || 0) >= 75) return `${label} for your goals!`;
    if ((score || 0) >= 50) return `${label} - could be better`;
    return `${label} - consider alternatives`;
  };

  const toggleFavorite = () => {
    if (isFavorite) {
      removeFromFavorites(barcode || '');
    } else {
      addToFavorites(product);
    }
  };

  const getNegativeReasons = (reasons: string[]) => {
    return reasons.filter(reason => 
      reason.includes('High') || 
      reason.includes('Very high') || 
      reason.includes('Contains') ||
      reason.includes('additive')
    );
  };

  const getPositiveReasons = (reasons: string[]) => {
    return reasons.filter(reason => 
      reason.includes('Good') || 
      reason.includes('Excellent') ||
      reason.includes('Low') && !reason.includes('Very high')
    );
  };

  const getReasonIcon = (reason: string, isNegative: boolean) => {
    if (reason.includes('additive') || reason.includes('Contains')) {
      return <Package size={20} color="#9CA3AF" />;
    }
    if (reason.includes('sodium') || reason.includes('salt')) {
      return <Droplet size={20} color="#9CA3AF" />;
    }
    if (reason.includes('protein')) {
      return <Fish size={20} color="#9CA3AF" />;
    }
    if (reason.includes('fiber')) {
      return <Wheat size={20} color="#9CA3AF" />;
    }
    if (reason.includes('sugar')) {
      return <Package size={20} color="#9CA3AF" />;
    }
    if (reason.includes('calorie')) {
      return <Zap size={20} color="#9CA3AF" />;
    }
    if (reason.includes('fat')) {
      return <Droplet size={20} color="#9CA3AF" />;
    }
    return <Package size={20} color="#9CA3AF" />;
  };

  const getReasonTitle = (reason: string) => {
    if (reason.includes('additive')) return 'Additives';
    if (reason.includes('sodium')) return 'Sodium';
    if (reason.includes('protein')) return 'Protein';
    if (reason.includes('fiber')) return 'Fiber';
    if (reason.includes('sugar')) return 'Sugar';
    if (reason.includes('calorie')) return 'Calories';
    if (reason.includes('saturated')) return 'Saturated fat';
    return 'Nutrient';
  };

  const getReasonDescription = (reason: string) => {
    if (reason.includes('additive')) return 'Contains additives to avoid';
    if (reason.includes('Very high sodium')) return 'A bit too much sodium';
    if (reason.includes('High sodium')) return 'Moderate sodium content';
    if (reason.includes('Excellent protein')) return 'Excellent amount of protein';
    if (reason.includes('Good protein')) return 'Good amount of protein';
    if (reason.includes('Excellent fiber')) return 'Excellent amount of fiber';
    if (reason.includes('Good fiber')) return 'Good amount of fiber';
    if (reason.includes('Very high sugar')) return 'Very high sugar content';
    if (reason.includes('High sugar')) return 'High sugar content';
    if (reason.includes('Low sugar')) return 'Low sugar';
    if (reason.includes('calorie')) return 'Low impact';
    if (reason.includes('saturated')) return 'Low impact';
    return reason;
  };

  const getReasonValue = (reason: string, product: any) => {
    if (reason.includes('additive')) {
      const count = reason.match(/\d+/);
      return count ? count[0] : '0';
    }
    
    // Display values based on nutrition basis - per serving or per 100g
    if (reason.includes('sodium')) {
      const sodium = (product.nutriments.sodium || 0) * 1000;
      return `${Math.round(sodium)}mg`;
    }
    if (reason.includes('protein')) {
      return `${(product.nutriments.protein || 0).toFixed(0)}g`;
    }
    if (reason.includes('fiber')) {
      return `${(product.nutriments.fiber || 0).toFixed(0)}g`;
    }
    if (reason.includes('sugar')) {
      return `${(product.nutriments.sugars || 0).toFixed(0)}g`;
    }
    if (reason.includes('calorie')) {
      return `${Math.round(product.nutriments.energyKcal || 0)} Cal`;
    }
    if (reason.includes('saturated')) {
      return `${(product.nutriments.saturatedFat || 0).toFixed(1)}g`;
    }
    return '';
  };

  const getReasonColor = (reason: string, isNegative: boolean) => {
    if (isNegative) {
      if (reason.includes('Very high') || reason.includes('additive')) return '#EF4444';
      return '#F59E0B';
    } else {
      return '#22C55E';
    }
  };

  const getNutrientColor = (value: number, type: string) => {
    if (type === "protein" || type === "fiber") {
      if (value >= 10) return Colors.health.excellent;
      if (value >= 5) return Colors.health.good;
      return Colors.health.fair;
    } else {
      if (value <= 5) return Colors.health.excellent;
      if (value <= 10) return Colors.health.good;
      return Colors.health.poor;
    }
  };

  const generateAIInsights = async () => {
    if (!userPreferences) return;
    
    setIsAnalyzing(true);
    
    try {
      const userPrefs = {
        diet_type: userPreferences.diet_type,
        health_goals: userPreferences.health_goals || [],
        body_goal: userPreferences.body_goal
      };

      const result = await nutritionInsightsMutation.mutateAsync({
        product: {
          barcode: product.barcode,
          name: product.name,
          brand: product.brand,
          ingredientsText: product.ingredientsText,
          nutritionBasis: product.nutritionBasis,
          nutriments: product.nutriments,
          source: product.source
        },
        score: score || 0,
        userPreferences: userPrefs
      });
      
      setAiInsights(result.overallAssessment);
    } catch (error) {
      console.error('AI insights failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePhotoTaken = async (imageBase64: string) => {
    setShowCamera(false);
    setIsAnalyzing(true);
    
    try {
      const ocrResult = await ocrMutation.mutateAsync({ imageBase64 });
      
      if (ocrResult.success && ocrResult.nutrition) {
        Alert.alert(
          'Nutrition Label Scanned',
          `Found: ${ocrResult.nutrition.calories || 'N/A'} calories, ${ocrResult.nutrition.protein || 'N/A'}g protein per serving`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Scan Failed', ocrResult.error || 'Could not read nutrition label clearly');
      }
    } catch (error) {
      console.error('OCR failed:', error);
      Alert.alert('Scan Error', 'Failed to process nutrition label image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={true}
      onRequestClose={() => router.back()}
    >
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={getScoreGradient()}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)/(scanner)/scan' as any);
                }
              }}
              testID="close-button"
            >
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={toggleFavorite}
              testID="favorite-button"
            >
              <Heart 
                size={24} 
                color="#FFFFFF" 
                fill={isFavorite ? "#FFFFFF" : "transparent"}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.scoreContainer}>
            <Text style={styles.scoreEmoji}>{getScoreEmoji()}</Text>
            <Text style={styles.scoreValue}>{score || 0}</Text>
            <Text style={styles.scoreLabel}>Health Score</Text>
            <Text style={styles.scoreMessage}>{getScoreMessage()}</Text>
            <Text style={styles.personalizationInfo}>
              Your goals: {userPreferences.body_goal?.replace('_', ' ')} • {userPreferences.health_goals?.join(' • ')} • {userPreferences.diet_type?.replace('_', ' ')}
            </Text>
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.productCard}>
            <Image source={{ uri: product.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image' }} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productBrand}>{product.brand || 'Unknown Brand'}</Text>
              <Text style={styles.productCategory}>{product.categories?.join(', ') || 'Unknown Category'}</Text>
            </View>
          </View>

          {/* Negatives Section */}
          {getNegativeReasons(reasons).length > 0 && (
            <View style={styles.analysisCard}>
              <Text style={styles.sectionTitle}>Negatives</Text>
              <Text style={styles.servingSize}>
                {product.nutritionBasis === 'per_serving' && product.servingSize
                  ? `per ${product.servingSize.amount} ${product.servingSize.unit} (${product.servingSize.weightGrams}g)` 
                  : 'per 100g serving'
                } •••
              </Text>
              {getNegativeReasons(reasons).map((reason, index) => (
                <View key={index} style={styles.analysisItem}>
                  <View style={styles.analysisIcon}>
                    {getReasonIcon(reason, true)}
                  </View>
                  <View style={styles.analysisContent}>
                    <Text style={styles.analysisTitle}>{getReasonTitle(reason)}</Text>
                    <Text style={styles.analysisDescription}>{getReasonDescription(reason)}</Text>
                  </View>
                  <View style={styles.analysisValue}>
                    <Text style={styles.analysisValueText}>{getReasonValue(reason, product)}</Text>
                    <View style={[styles.analysisIndicator, { backgroundColor: getReasonColor(reason, true) }]} />
                    <ChevronDown size={16} color="#9CA3AF" />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Positives Section */}
          {getPositiveReasons(reasons).length > 0 && (
            <View style={styles.analysisCard}>
              <Text style={styles.sectionTitle}>Positives</Text>
              <Text style={styles.servingSize}>
                {product.nutritionBasis === 'per_serving' && product.servingSize
                  ? `per ${product.servingSize.amount} ${product.servingSize.unit} (${product.servingSize.weightGrams}g)` 
                  : 'per 100g serving'
                } •••
              </Text>
              {getPositiveReasons(reasons).map((reason, index) => (
                <View key={index} style={styles.analysisItem}>
                  <View style={styles.analysisIcon}>
                    {getReasonIcon(reason, false)}
                  </View>
                  <View style={styles.analysisContent}>
                    <Text style={styles.analysisTitle}>{getReasonTitle(reason)}</Text>
                    <Text style={styles.analysisDescription}>{getReasonDescription(reason)}</Text>
                  </View>
                  <View style={styles.analysisValue}>
                    <Text style={styles.analysisValueText}>{getReasonValue(reason, product)}</Text>
                    <View style={[styles.analysisIndicator, { backgroundColor: getReasonColor(reason, false) }]} />
                    <ChevronDown size={16} color="#9CA3AF" />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* AI Analysis Section */}
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <Brain size={24} color="#FF3B30" />
              <Text style={styles.sectionTitle}>AI Analysis</Text>
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={() => setShowCamera(true)}
              >
                <Camera size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
            
            {aiInsights ? (
              <Text style={styles.aiInsightsText}>{aiInsights}</Text>
            ) : (
              <TouchableOpacity 
                style={styles.generateInsightsButton}
                onPress={generateAIInsights}
                disabled={isAnalyzing}
              >
                <Text style={styles.generateInsightsText}>
                  {isAnalyzing ? 'Analyzing...' : 'Generate AI Insights'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Recommendations Section */}
          <View style={styles.recommendationsCard}>
            <View style={styles.recommendationsHeader}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recommendationItem}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop' }} 
                style={styles.recommendationImage} 
              />
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationName}>Protein Bar - Blueberry</Text>
                <Text style={styles.recommendationBrand}>Better Brand</Text>
              </View>
            </View>
          </View>

          <View style={styles.nutritionCard}>
            <Text style={styles.sectionTitle}>Nutrition Facts</Text>
            <Text style={styles.dataSource}>
              Data from: {product.source.toUpperCase()} • {product.nutritionBasis === 'per_serving' && product.servingSize
                ? `Per ${product.servingSize.amount} ${product.servingSize.unit} (${product.servingSize.weightGrams}g)`
                : 'Per 100g'
              }
            </Text>
            
            {/* Macronutrients */}
            <View style={styles.nutritionSection}>
              <View style={styles.sectionHeader}>
                <Zap size={20} color="#FF3B30" />
                <Text style={styles.nutritionSubtitle}>Macronutrients</Text>
              </View>
              <View style={styles.nutritionGrid}>
                {Object.entries(product.nutriments)
                  .filter(([key, value]) => {
                    const macroKeys = ['energyKcal', 'carbohydrates', 'sugars', 'fiber', 'protein', 'fat', 'saturatedFat', 'sodium', 'salt'];
                    return macroKeys.includes(key) && value !== undefined && value !== null;
                  })
                  .map(([key, value]: [string, unknown]) => {
                    const displayName = key === 'energyKcal' ? 'Calories' : 
                      key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                    const unit = key === 'energyKcal' ? 'kcal' : 
                      key === 'sodium' ? 'mg' : 'g';
                    
                    // Display values as they are - per serving if that's the basis, per 100g otherwise
                    let displayValue: string;
                    let normalizedValue: number = value as number; // For color calculation
                    
                    if (product.nutritionBasis === 'per_serving') {
                      // Show actual per-serving values
                      if (key === 'sodium') {
                        displayValue = ((value as number) * 1000).toFixed(0);
                      } else {
                        displayValue = typeof value === 'number' ? value.toFixed(1) : String(value);
                      }
                      
                      // For color calculation, convert to per-100g equivalent if serving size is available
                      if (product.servingSize?.weightGrams) {
                        const conversionFactor = 100 / product.servingSize.weightGrams;
                        normalizedValue = (value as number) * conversionFactor;
                      }
                    } else {
                      // Already per 100g
                      if (key === 'sodium') {
                        displayValue = ((value as number) * 1000).toFixed(0);
                      } else {
                        displayValue = typeof value === 'number' ? value.toFixed(1) : String(value);
                      }
                    }
                    
                    // Get daily value percentage
                    const dailyValues: { [key: string]: number } = {
                      energyKcal: 2000,
                      carbohydrates: 300,
                      sugars: 50,
                      fiber: 25,
                      protein: 50,
                      fat: 65,
                      saturatedFat: 20,
                      sodium: 2300
                    };
                    
                    const dailyValue = dailyValues[key];
                    const percentage = dailyValue ? Math.min((normalizedValue / dailyValue) * 100, 100) : 0;
                    
                    return (
                      <View key={key} style={styles.nutritionItem}>
                        <Text style={styles.nutritionLabel}>{displayName}</Text>
                        <Text 
                          style={[
                            styles.nutritionValue,
                            { color: getNutrientColor(normalizedValue, key) }
                          ]}
                        >
                          {displayValue}{unit}
                        </Text>
                        {dailyValue && (
                          <Text style={styles.dailyValueText}>{percentage.toFixed(0)}% DV</Text>
                        )}
                      </View>
                    );
                  })
                }
              </View>
            </View>
            
            {/* Vitamins */}
            {Object.entries(product.nutriments)
              .filter(([key, value]) => {
                const vitaminKeys = ['vitaminA', 'vitaminC', 'vitaminD', 'vitaminE', 'vitaminK', 'thiamin', 'riboflavin', 'niacin', 'vitaminB6', 'folate', 'vitaminB12'];
                return vitaminKeys.includes(key) && value !== undefined && value !== null && (value as number) > 0;
              }).length > 0 && (
              <View style={styles.nutritionSection}>
                <View style={styles.sectionHeader}>
                  <Package size={20} color="#22C55E" />
                  <Text style={styles.nutritionSubtitle}>Vitamins</Text>
                </View>
                <View style={styles.nutritionGrid}>
                  {Object.entries(product.nutriments)
                    .filter(([key, value]) => {
                      const vitaminKeys = ['vitaminA', 'vitaminC', 'vitaminD', 'vitaminE', 'vitaminK', 'thiamin', 'riboflavin', 'niacin', 'vitaminB6', 'folate', 'vitaminB12'];
                      return vitaminKeys.includes(key) && value !== undefined && value !== null && (value as number) > 0;
                    })
                    .map(([key, value]: [string, unknown]) => {
                      const displayNames: { [key: string]: string } = {
                        vitaminA: 'Vitamin A',
                        vitaminC: 'Vitamin C',
                        vitaminD: 'Vitamin D',
                        vitaminE: 'Vitamin E',
                        vitaminK: 'Vitamin K',
                        thiamin: 'Thiamin (B1)',
                        riboflavin: 'Riboflavin (B2)',
                        niacin: 'Niacin (B3)',
                        vitaminB6: 'Vitamin B6',
                        folate: 'Folate',
                        vitaminB12: 'Vitamin B12'
                      };
                      
                      const units: { [key: string]: string } = {
                        vitaminA: 'μg',
                        vitaminC: 'mg',
                        vitaminD: 'μg',
                        vitaminE: 'mg',
                        vitaminK: 'μg',
                        thiamin: 'mg',
                        riboflavin: 'mg',
                        niacin: 'mg',
                        vitaminB6: 'mg',
                        folate: 'μg',
                        vitaminB12: 'μg'
                      };
                      
                      const dailyValues: { [key: string]: number } = {
                        vitaminA: 900,
                        vitaminC: 90,
                        vitaminD: 20,
                        vitaminE: 15,
                        vitaminK: 120,
                        thiamin: 1.2,
                        riboflavin: 1.3,
                        niacin: 16,
                        vitaminB6: 1.7,
                        folate: 400,
                        vitaminB12: 2.4
                      };
                      
                      const displayName = displayNames[key] || key;
                      const unit = units[key] || 'mg';
                      const displayValue = typeof value === 'number' ? (value < 1 ? value.toFixed(2) : value.toFixed(1)) : String(value);
                      const dailyValue = dailyValues[key];
                      const percentage = dailyValue ? Math.min(((value as number) / dailyValue) * 100, 100) : 0;
                      
                      return (
                        <View key={key} style={styles.nutritionItem}>
                          <Text style={styles.nutritionLabel}>{displayName}</Text>
                          <Text style={[styles.nutritionValue, { color: '#22C55E' }]}>
                            {displayValue}{unit}
                          </Text>
                          {dailyValue && (
                            <Text style={styles.dailyValueText}>{percentage.toFixed(0)}% DV</Text>
                          )}
                        </View>
                      );
                    })
                  }
                </View>
              </View>
            )}
            
            {/* Minerals */}
            {Object.entries(product.nutriments)
              .filter(([key, value]) => {
                const mineralKeys = ['calcium', 'iron', 'potassium', 'magnesium', 'phosphorus', 'zinc'];
                return mineralKeys.includes(key) && value !== undefined && value !== null && (value as number) > 0;
              }).length > 0 && (
              <View style={styles.nutritionSection}>
                <View style={styles.sectionHeader}>
                  <Droplet size={20} color="#3B82F6" />
                  <Text style={styles.nutritionSubtitle}>Minerals</Text>
                </View>
                <View style={styles.nutritionGrid}>
                  {Object.entries(product.nutriments)
                    .filter(([key, value]) => {
                      const mineralKeys = ['calcium', 'iron', 'potassium', 'magnesium', 'phosphorus', 'zinc'];
                      return mineralKeys.includes(key) && value !== undefined && value !== null && (value as number) > 0;
                    })
                    .map(([key, value]: [string, unknown]) => {
                      const displayNames: { [key: string]: string } = {
                        calcium: 'Calcium',
                        iron: 'Iron',
                        potassium: 'Potassium',
                        magnesium: 'Magnesium',
                        phosphorus: 'Phosphorus',
                        zinc: 'Zinc'
                      };
                      
                      const dailyValues: { [key: string]: number } = {
                        calcium: 1300,
                        iron: 18,
                        potassium: 4700,
                        magnesium: 420,
                        phosphorus: 1250,
                        zinc: 11
                      };
                      
                      const displayName = displayNames[key] || key;
                      const displayValue = typeof value === 'number' ? (value < 1 ? value.toFixed(2) : value.toFixed(1)) : String(value);
                      const dailyValue = dailyValues[key];
                      const percentage = dailyValue ? Math.min(((value as number) / dailyValue) * 100, 100) : 0;
                      
                      return (
                        <View key={key} style={styles.nutritionItem}>
                          <Text style={styles.nutritionLabel}>{displayName}</Text>
                          <Text style={[styles.nutritionValue, { color: '#3B82F6' }]}>
                            {displayValue}mg
                          </Text>
                          {dailyValue && (
                            <Text style={styles.dailyValueText}>{percentage.toFixed(0)}% DV</Text>
                          )}
                        </View>
                      );
                    })
                  }
                </View>
              </View>
            )}
          </View>

          {product.ingredientsText && (
            <View style={styles.ingredientsCard}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <Text style={styles.ingredientsText}>{product.ingredientsText}</Text>
            </View>
          )}
          
          {product.allergens && product.allergens.length > 0 && (
            <View style={styles.additivesCard}>
              <View style={styles.additivesHeader}>
                <AlertCircle size={20} color="#F59E0B" />
                <Text style={styles.sectionTitle}>Allergens</Text>
              </View>
              <View style={styles.additivesGrid}>
                {product.allergens.map((allergen: string, index: number) => (
                  <View key={index} style={styles.additiveBadge}>
                    <Text style={styles.additiveText}>{allergen}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.alternativesButton}
            onPress={() => setShowAlternatives(true)}
            testID="alternatives-button"
          >
            <LinearGradient
              colors={['#FF3B30', '#FF6B5A']}
              style={styles.alternativesButtonGradient}
            >
              <ShoppingCart size={20} color="#FFFFFF" />
              <Text style={styles.alternativesButtonText}>
                View Better Alternatives
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          animationType="fade"
          transparent={true}
          visible={showAlternatives}
          onRequestClose={() => setShowAlternatives(false)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setShowAlternatives(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Better Alternatives</Text>
              <Text style={styles.modalText}>
                Based on your goals, consider these healthier options:
              </Text>
              
              <View style={styles.alternativesList}>
                <View style={styles.alternativeItem}>
                  <Text style={styles.alternativeName}>Organic Whole Grain Option</Text>
                  <Text style={styles.alternativeScore}>Score: 85</Text>
                </View>
                <View style={styles.alternativeItem}>
                  <Text style={styles.alternativeName}>Low Sugar Alternative</Text>
                  <Text style={styles.alternativeScore}>Score: 78</Text>
                </View>
                <View style={styles.alternativeItem}>
                  <Text style={styles.alternativeName}>High Protein Version</Text>
                  <Text style={styles.alternativeScore}>Score: 82</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowAlternatives(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
        
        {showCamera && (
          <NutritionCamera
            onPhotoTaken={handlePhotoTaken}
            onClose={() => setShowCamera(false)}
            isProcessing={isAnalyzing}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    marginTop: 80,
  },
  closeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 16,
    borderRadius: 12,
    minWidth: 48,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 16,
    borderRadius: 12,
    minWidth: 48,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreContainer: {
    alignItems: "center",
  },
  scoreEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  scoreLabel: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 8,
  },
  scoreMessage: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  productName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  analysisCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  analysisItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 4,
  },
  analysisIcon: {
    marginRight: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  analysisContent: {
    flex: 1,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  analysisDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  analysisValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  analysisValueText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  analysisIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nutritionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  servingSize: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  nutritionItem: {
    width: "48%",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
  },
  nutritionLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  nutritionSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 8,
  },
  nutritionSection: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  dataSource: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 16,
    fontStyle: "italic",
  },
  dailyValueText: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 2,
  },
  additivesCard: {
    backgroundColor: "#FEF3C720",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FEF3C740",
  },
  additivesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  additivesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  additiveBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  additiveText: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "500",
  },
  alternativesButton: {
    borderRadius: 12,
    marginBottom: 32,
    overflow: 'hidden',
  },
  alternativesButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    padding: 16,
  },
  alternativesButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
  },
  alternativesList: {
    gap: 12,
    marginBottom: 20,
  },
  alternativeItem: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  alternativeName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  alternativeScore: {
    fontSize: 14,
    color: "#FF3B30",
    fontWeight: "600",
  },
  modalButton: {
    backgroundColor: "#FF3B30",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: "#EF4444",
    marginBottom: 16,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  ingredientsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ingredientsText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  recommendationsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recommendationsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "600",
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
  },
  recommendationImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
    marginRight: 12,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  recommendationBrand: {
    fontSize: 14,
    color: "#6B7280",
  },
  personalizationInfo: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center" as const,
    marginTop: 8,
    fontStyle: "italic" as const,
  },
  aiCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#FF3B3020",
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cameraButton: {
    marginLeft: "auto",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FF3B3010",
  },
  aiInsightsText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#374151",
  },
  generateInsightsButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  generateInsightsText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});