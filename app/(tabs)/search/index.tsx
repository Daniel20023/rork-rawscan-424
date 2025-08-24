import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
} from "react-native";
import { Search, Filter, X } from "lucide-react-native";

import { mockProducts } from "@/mocks/products";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { getHealthScore } from "@/utils/scoring";
import { router } from "expo-router";
import { Colors, BorderRadius, Shadows, FontWeights, Spacing } from "@/constants/colors";

interface FilterState {
  category: string[];
  maxCalories: number | null;
  maxSugar: number | null;
  maxSalt: number | null;
  minProtein: number | null;
  minFiber: number | null;
  vegan: boolean;
  lowSugar: boolean;
  highProtein: boolean;
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [manualBarcode, setManualBarcode] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    category: [],
    maxCalories: null,
    maxSugar: null,
    maxSalt: null,
    minProtein: null,
    minFiber: null,
    vegan: false,
    lowSugar: false,
    highProtein: false,
  });

  const preferences = useUserPreferences();

  const allProducts = useMemo(() => {
    // Safety check for preferences
    if (!preferences || preferences.isLoading) {
      return [];
    }
    
    return Object.entries(mockProducts)
      .filter(([key]) => key !== "default")
      .map(([barcode, product]) => {
        // Safety check for product data
        if (!product || !product.nutrition) {
          console.warn('Invalid product data for barcode:', barcode, product);
          return null;
        }
        return {
          barcode,
          ...product,
          score: getHealthScore(product, preferences),
        };
      })
      .filter(Boolean); // Remove any null entries
  }, [preferences]);

  const categories = useMemo(() => {
    if (!allProducts || allProducts.length === 0) {
      return [];
    }
    const cats = new Set(allProducts.map(p => p?.category).filter(Boolean));
    return Array.from(cats);
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) {
      return [];
    }
    let filtered = allProducts;

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        product =>
          product.name.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filters.category.length > 0) {
      filtered = filtered.filter(product =>
        filters.category.includes(product.category)
      );
    }

    // Nutrition filters
    if (filters.maxCalories !== null) {
      filtered = filtered.filter(product => product.nutrition.calories <= filters.maxCalories!);
    }
    if (filters.maxSugar !== null) {
      filtered = filtered.filter(product => product.nutrition.sugar <= filters.maxSugar!);
    }
    if (filters.maxSalt !== null) {
      filtered = filtered.filter(product => product.nutrition.salt <= filters.maxSalt!);
    }
    if (filters.minProtein !== null) {
      filtered = filtered.filter(product => product.nutrition.protein >= filters.minProtein!);
    }
    if (filters.minFiber !== null) {
      filtered = filtered.filter(product => product.nutrition.fiber >= filters.minFiber!);
    }

    // Quick filters
    if (filters.vegan) {
      filtered = filtered.filter(product => 
        !product.ingredients?.some((ing: string) => 
          ing.toLowerCase().includes('milk') || 
          ing.toLowerCase().includes('egg') || 
          ing.toLowerCase().includes('honey')
        )
      );
    }
    if (filters.lowSugar) {
      filtered = filtered.filter(product => product.nutrition.sugar <= 5);
    }
    if (filters.highProtein) {
      filtered = filtered.filter(product => product.nutrition.protein >= 15);
    }

    return filtered.sort((a, b) => b.score - a.score);
  }, [allProducts, searchQuery, filters]);

  const handleManualBarcodeSearch = () => {
    if (manualBarcode.trim()) {
      router.push(`/product/${manualBarcode.trim()}`);
    }
  };

  const toggleCategoryFilter = (category: string) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category.includes(category)
        ? prev.category.filter(c => c !== category)
        : [...prev.category, category]
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: [],
      maxCalories: null,
      maxSugar: null,
      maxSalt: null,
      minProtein: null,
      minFiber: null,
      vegan: false,
      lowSugar: false,
      highProtein: false,
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return Colors.health.excellent;
    if (score >= 60) return Colors.health.fair;
    return Colors.health.poor;
  };

  const renderProduct = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => router.push(`/product/${item.barcode}`)}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.productBrand}>{item.brand}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionText}>
            {item.nutrition.calories} cal • {item.nutrition.sugar}g sugar
          </Text>
        </View>
      </View>
      <View style={[styles.scoreContainer, { backgroundColor: getScoreColor(item.score) }]}>
        <Text style={styles.scoreText}>{Math.round(item.score)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brandTitle}>RawScan</Text>
        <Text style={styles.headerTitle}>Search & Filters</Text>
        <Text style={styles.headerSubtitle}>
          Find products that match your health goals
        </Text>
      </View>
      
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.neutral.gray400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products by name, brand..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.neutral.gray400}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={20} color={Colors.neutral.gray400} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.barcodeContainer}>
          <TextInput
            style={styles.barcodeInput}
            placeholder="Or enter barcode manually"
            value={manualBarcode}
            onChangeText={setManualBarcode}
            keyboardType="numeric"
            placeholderTextColor={Colors.neutral.gray400}
          />
          <TouchableOpacity
            style={[styles.barcodeButton, !manualBarcode.trim() && styles.barcodeButtonDisabled]}
            onPress={handleManualBarcodeSearch}
            disabled={!manualBarcode.trim()}
          >
            <Text style={manualBarcode.trim() ? styles.barcodeButtonText : styles.barcodeButtonTextDisabled}>
              Search
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={Colors.primary.red} />
          <Text style={styles.filterButtonText}>Filters</Text>
          {Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v !== null && v !== false) && (
            <View style={styles.filterBadge} />
          )}
        </TouchableOpacity>
      </View>

      {showFilters && (
        <ScrollView style={styles.filtersContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Quick Filters</Text>
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.clearFilters}>Clear All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.quickFilters}>
              <TouchableOpacity
                style={[styles.quickFilter, filters.vegan && styles.quickFilterActive]}
                onPress={() => setFilters(prev => ({ ...prev, vegan: !prev.vegan }))}
              >
                <Text style={[styles.quickFilterText, filters.vegan && styles.quickFilterTextActive]}>
                  Vegan
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickFilter, filters.lowSugar && styles.quickFilterActive]}
                onPress={() => setFilters(prev => ({ ...prev, lowSugar: !prev.lowSugar }))}
              >
                <Text style={[styles.quickFilterText, filters.lowSugar && styles.quickFilterTextActive]}>
                  Low Sugar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickFilter, filters.highProtein && styles.quickFilterActive]}
                onPress={() => setFilters(prev => ({ ...prev, highProtein: !prev.highProtein }))}
              >
                <Text style={[styles.quickFilterText, filters.highProtein && styles.quickFilterTextActive]}>
                  High Protein
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Categories</Text>
            <View style={styles.categoryFilters}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryFilter,
                    filters.category.includes(category) && styles.categoryFilterActive
                  ]}
                  onPress={() => toggleCategoryFilter(category)}
                >
                  <Text style={[
                    styles.categoryFilterText,
                    filters.category.includes(category) && styles.categoryFilterTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsCount}>
          {filteredProducts.length} products found
        </Text>
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={item => item.barcode}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.productsList}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    backgroundColor: Colors.primary.red,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    ...Shadows.card,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: FontWeights.bold,
    color: Colors.neutral.white,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: FontWeights.bold,
    color: Colors.neutral.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: FontWeights.medium,
  },
  searchSection: {
    backgroundColor: Colors.background.primary,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray100,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral.gray100,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: Colors.neutral.gray800,
  },
  barcodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  barcodeInput: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.neutral.gray100,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    color: Colors.neutral.gray800,
    marginRight: Spacing.md,
  },
  barcodeButton: {
    backgroundColor: Colors.primary.red,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.button,
  },
  barcodeButtonDisabled: {
    backgroundColor: Colors.neutral.gray300,
    ...Shadows.card,
  },
  barcodeButtonText: {
    color: Colors.neutral.white,
    fontWeight: FontWeights.semibold,
    fontSize: 14,
  },
  barcodeButtonTextDisabled: {
    color: Colors.neutral.gray500,
    fontWeight: FontWeights.semibold,
    fontSize: 14,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: '#FEF2F2',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    position: "relative",
  },
  filterButtonText: {
    color: Colors.primary.red,
    fontWeight: FontWeights.semibold,
    marginLeft: Spacing.sm,
  },
  filterBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 8,
    height: 8,
    backgroundColor: Colors.primary.red,
    borderRadius: 4,
  },
  filtersContainer: {
    backgroundColor: Colors.background.primary,
    maxHeight: 300,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray100,
  },
  filterSection: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray100,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: FontWeights.semibold,
    color: Colors.neutral.gray800,
  },
  clearFilters: {
    color: Colors.primary.red,
    fontSize: 14,
    fontWeight: FontWeights.medium,
  },
  quickFilters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickFilter: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.neutral.gray100,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
  },
  quickFilterActive: {
    backgroundColor: Colors.primary.red,
    borderColor: Colors.primary.red,
  },
  quickFilterText: {
    fontSize: 14,
    color: Colors.neutral.gray600,
    fontWeight: FontWeights.medium,
  },
  quickFilterTextActive: {
    color: Colors.neutral.white,
  },
  categoryFilters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryFilter: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.neutral.gray100,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
  },
  categoryFilterActive: {
    backgroundColor: Colors.primary.red,
    borderColor: Colors.primary.red,
  },
  categoryFilterText: {
    fontSize: 12,
    color: Colors.neutral.gray600,
    fontWeight: FontWeights.medium,
  },
  categoryFilterTextActive: {
    color: Colors.neutral.white,
  },
  resultsContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  resultsCount: {
    fontSize: 14,
    color: Colors.neutral.gray600,
    marginBottom: Spacing.md,
    fontWeight: FontWeights.medium,
  },
  productsList: {
    paddingBottom: 20,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.neutral.gray100,
  },
  productInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 16,
    fontWeight: FontWeights.semibold,
    color: Colors.neutral.gray800,
    marginBottom: 2,
  },
  productBrand: {
    fontSize: 14,
    color: Colors.neutral.gray600,
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 12,
    color: Colors.neutral.gray400,
    marginBottom: 4,
  },
  nutritionRow: {
    flexDirection: "row",
  },
  nutritionText: {
    fontSize: 12,
    color: Colors.neutral.gray600,
  },
  scoreContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  scoreText: {
    color: Colors.neutral.white,
    fontSize: 14,
    fontWeight: FontWeights.bold,
  },
});