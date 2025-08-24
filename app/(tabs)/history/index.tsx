import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Clock, TrendingUp, TrendingDown, Minus, Trash2 } from "lucide-react-native";

import { useProductHistory } from "@/contexts/ProductHistoryContext";
import { Colors, BorderRadius, Shadows, FontWeights, Spacing } from "@/constants/colors";

export default function HistoryScreen() {
  const { history, isLoading, clearHistory } = useProductHistory();

  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Loading...</Text>
      </View>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return Colors.health.excellent;
    if (score >= 60) return Colors.health.fair;
    return Colors.health.poor;
  };

  const getScoreTrend = (score: number) => {
    if (score >= 80) return <TrendingUp size={16} color={Colors.health.excellent} />;
    if (score >= 60) return <Minus size={16} color={Colors.health.fair} />;
    return <TrendingDown size={16} color={Colors.health.poor} />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return date.toLocaleDateString([], { 
        month: "short", 
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
  };

  const handleDeleteScan = (barcode: string) => {
    // For now, we'll just show an alert since we're using local storage
    Alert.alert(
      'Delete Item',
      'This feature will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const score = item.score || 50;
    const scoreColor = getScoreColor(score);
    const product = item.product;

    return (
      <TouchableOpacity
        style={styles.historyItem}
        onPress={() => router.push(`/product/${item.barcode}` as any)}
        testID={`history-item-${item.barcode}`}
      >
        <View style={styles.productImageContainer}>
          <View style={styles.productImage}>
            <Text style={styles.productImageText}>
              {(product?.name || 'Product')[0].toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {product?.name || 'Unknown Product'}
          </Text>
          <Text style={styles.productBrand} numberOfLines={1}>
            {product?.brand || 'Unknown Brand'}
          </Text>
          <View style={styles.dateRow}>
            <Clock size={12} color="#9CA3AF" />
            <Text style={styles.scanDate}>{formatDate(item.scannedAt)}</Text>
          </View>
        </View>

        <View style={styles.scoreContainer}>
          <View style={[styles.scoreBadge, { backgroundColor: scoreColor + "20" }]}>
            <Text style={[styles.scoreText, { color: scoreColor }]}>{score}</Text>
            {getScoreTrend(score)}
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteScan(item.barcode)}
          >
            <Trash2 size={16} color={Colors.neutral.gray400} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Clock size={64} color="#D1D5DB" style={{ marginBottom: 16 }} />
        <Text style={styles.emptyTitle}>No Scan History</Text>
        <Text style={styles.emptyText}>
          Products you scan will appear here
        </Text>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => router.push("/(tabs)/(scanner)" as any)}
        >
          <Text style={styles.scanButtonText}>Start Scanning</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brandTitle}>RawScan</Text>
        <Text style={styles.headerTitle}>Scan History</Text>
        <Text style={styles.headerSubtitle}>
          {history.length} {history.length === 1 ? 'product' : 'products'} scanned
        </Text>
      </View>
      
      <FlatList
        data={history}
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
  historyItem: {
    flexDirection: "row",
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  productImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scanDate: {
    fontSize: 12,
    color: Colors.neutral.gray400,
  },
  scoreContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  deleteButton: {
    marginTop: Spacing.sm,
    padding: Spacing.xs,
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: FontWeights.bold,
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
});