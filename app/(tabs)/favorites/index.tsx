import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Heart, Star } from "lucide-react-native";

import { useProductHistory } from "@/contexts/ProductHistoryContext";
import { Colors, BorderRadius, Shadows, FontWeights, Spacing } from "@/constants/colors";

export default function FavoritesScreen() {
  const { favorites, isLoading, removeFromFavorites } = useProductHistory();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading favorites...</Text>
      </View>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return Colors.health.excellent;
    if (score >= 60) return Colors.health.fair;
    return Colors.health.poor;
  };

  const handleRemoveFavorite = (barcode: string) => {
    removeFromFavorites(barcode);
  };

  const renderItem = ({ item }: { item: any }) => {
    // For favorites from local storage, we need to calculate a score
    const score = 75; // Default score for favorites
    const scoreColor = getScoreColor(score);

    return (
      <TouchableOpacity
        style={styles.favoriteItem}
        onPress={() => router.push(`/product/${item.barcode}` as any)}
        testID={`favorite-item-${item.barcode}`}
      >
        <View style={styles.productImage}>
          <Text style={styles.productImageText}>
            {(item.name || 'Product')[0].toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name || 'Unknown Product'}
          </Text>
          <Text style={styles.productBrand} numberOfLines={1}>
            {item.brand || 'Unknown Brand'}
          </Text>
          <View style={styles.ratingRow}>
            <View style={[styles.scoreBadge, { backgroundColor: scoreColor + "20" }]}>
              <Star size={12} color={scoreColor} fill={scoreColor} />
              <Text style={[styles.scoreText, { color: scoreColor }]}>{score}</Text>
            </View>
            <Text style={styles.categoryText}>{'Food'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.heartButton}
          onPress={() => handleRemoveFavorite(item.barcode)}
          testID={`remove-favorite-${item.barcode}`}
        >
          <Heart size={20} color={Colors.primary.red} fill={Colors.primary.red} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (!favorites || favorites.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Heart size={64} color="#D1D5DB" style={{ marginBottom: 16 }} />
        <Text style={styles.emptyTitle}>No Favorites Yet</Text>
        <Text style={styles.emptyText}>
          Products you mark as favorites will appear here
        </Text>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => router.push("/(tabs)/(scanner)" as any)}
        >
          <Text style={styles.scanButtonText}>Scan Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brandTitle}>RawScan</Text>
        <Text style={styles.headerTitle}>Favorites</Text>
        <Text style={styles.headerSubtitle}>
          {favorites?.length || 0} {(favorites?.length || 0) === 1 ? "product" : "products"} saved
        </Text>
      </View>
      
      <FlatList
        data={favorites}
        renderItem={renderItem}
        keyExtractor={(item) => item.barcode}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {}}
            tintColor={Colors.primary.red}
          />
        }
      />
    </View>
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
  listContent: {
    padding: Spacing.lg,
  },
  favoriteItem: {
    flexDirection: "row",
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImageText: {
    fontSize: 24,
    fontWeight: FontWeights.bold,
    color: Colors.neutral.white,
  },
  productInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
    justifyContent: "center",
  },
  productName: {
    fontSize: 16,
    fontWeight: FontWeights.semibold,
    color: Colors.neutral.gray900,
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 14,
    color: Colors.neutral.gray600,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: FontWeights.semibold,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.neutral.gray400,
  },
  heartButton: {
    justifyContent: "center",
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xxxl,
    backgroundColor: Colors.background.secondary,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: FontWeights.semibold,
    color: Colors.neutral.gray900,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.neutral.gray600,
    textAlign: "center",
    marginBottom: Spacing.xxl,
  },
  scanButton: {
    backgroundColor: Colors.primary.red,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.button,
  },
  scanButtonText: {
    color: Colors.neutral.white,
    fontSize: 16,
    fontWeight: FontWeights.semibold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.neutral.gray600,
    fontWeight: FontWeights.medium,
  },
});