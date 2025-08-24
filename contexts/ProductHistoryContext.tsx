import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Product } from "@/backend/types/product";

// Legacy product interface for backward compatibility
interface LegacyProduct {
  barcode: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  nutrition: {
    calories: number;
    sugar: number;
    salt: number;
    saturated_fat: number;
    protein: number;
    fiber: number;
    carbs: number;
  };
  ingredients?: string[];
  additives?: string[];
}

interface HistoryItem {
  barcode: string;
  product: Product | LegacyProduct;
  scannedAt: string;
  score?: number;
  reasons?: string[];
}

const HISTORY_KEY = "rawscan_history";
const FAVORITES_KEY = "rawscan_favorites";

export const [ProductHistoryProvider, useProductHistory] = createContextHook(() => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [favorites, setFavorites] = useState<(Product | LegacyProduct)[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [historyData, favoritesData] = await Promise.all([
        AsyncStorage.getItem(HISTORY_KEY),
        AsyncStorage.getItem(FAVORITES_KEY),
      ]);

      if (historyData) {
        setHistory(JSON.parse(historyData));
      }
      if (favoritesData) {
        setFavorites(JSON.parse(favoritesData));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addToHistory = useCallback(async (item: HistoryItem) => {
    try {
      const updated = [item, ...history.filter(h => h.barcode !== item.barcode)].slice(0, 50);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      setHistory(updated);
    } catch (error) {
      console.error("Error adding to history:", error);
    }
  }, [history]);

  const addToFavorites = useCallback(async (product: Product | LegacyProduct) => {
    try {
      const updated = [...favorites, product];
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      setFavorites(updated);
    } catch (error) {
      console.error("Error adding to favorites:", error);
    }
  }, [favorites]);

  const removeFromFavorites = useCallback(async (barcode: string) => {
    try {
      const updated = favorites.filter(f => f.barcode !== barcode);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      setFavorites(updated);
    } catch (error) {
      console.error("Error removing from favorites:", error);
    }
  }, [favorites]);

  const clearHistory = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
      setHistory([]);
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  }, []);

  return useMemo(() => ({
    history,
    favorites,
    isLoading,
    addToHistory,
    addToFavorites,
    removeFromFavorites,
    clearHistory,
  }), [history, favorites, isLoading, addToHistory, addToFavorites, removeFromFavorites, clearHistory]);
});