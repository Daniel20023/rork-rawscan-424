import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Flashlight, FlashlightOff, Package } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { useProductHistory } from "@/contexts/ProductHistoryContext";
import { trpcClient } from "@/lib/trpc";
import { scoreProduct } from "@/utils/scoring";
import type { Product } from "@/backend/types/product";

const { width, height } = Dimensions.get("window");



export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const userPreferences = useUserPreferences();
  const { hasCompletedOnboarding, isLoading } = userPreferences;
  const { addToHistory } = useProductHistory();
  const cameraRef = useRef<CameraView>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Reset scan state when screen comes into focus
      setScanned(false);
      setIsProcessing(false);
    }, [])
  );

  useEffect(() => {
    // Only navigate when component is mounted and preferences are loaded
    if (isMounted && !isLoading && !hasCompletedOnboarding) {
      const timer = setTimeout(() => {
        try {
          router.replace("/onboarding" as any);
        } catch (error) {
          console.error("Navigation error:", error);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [hasCompletedOnboarding, isLoading, isMounted]);

  // Show loading while preferences are loading or component isn't mounted
  if (isLoading || !isMounted || !permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Package size={64} color="#FF3B30" style={{ marginBottom: 24 }} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            RawScan needs camera access to scan product barcodes and provide you with nutritional insights.
          </Text>
          <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
            <Text style={styles.grantButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const fetchProductFromAPI = async (barcode: string): Promise<Product | null> => {
    try {
      console.log(`🔍 Fetching product data for barcode: ${barcode}`);
      
      // Clean and validate barcode
      const cleanBarcode = barcode.replace(/\D/g, ''); // Remove non-digits
      if (cleanBarcode.length < 8) {
        console.error('❌ Invalid barcode format (too short):', barcode);
        return null;
      }
      
      console.log(`📡 Making API request for cleaned barcode: ${cleanBarcode}`);
      const result = await trpcClient.product.get.query({ barcode: cleanBarcode });
      
      console.log('📥 API Response:', {
        ok: result.ok,
        hasProduct: !!result.product,
        notFound: result.notFound,
        error: result.error,
        fromCache: result.fromCache
      });
      
      if (result.ok && result.product) {
        console.log(`✅ Product found from ${result.product.source}:`, result.product.name);
        if (result.fromCache) {
          console.log('📦 Product loaded from cache');
        }
        return result.product;
      } else if (result.notFound) {
        console.log('⚠️ Product not found in any database');
        return null;
      } else if (result.error) {
        console.error('❌ API error:', result.error);
        return null;
      }
      
      return null;
    } catch (error) {
      console.error('💥 Error fetching product data:', error);
      return null;
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || isProcessing) return;
    
    setScanned(true);
    setIsProcessing(true);
    
    console.log(`Scanned barcode: ${data} (type: ${type})`);
    
    try {
      // Fetch product from backend API
      const product = await fetchProductFromAPI(data);
      
      if (product) {
        // Calculate health score using new personalized scoring v1.1
        const userProfile = {
          name: userPreferences.name || 'User',
          gender: userPreferences.gender,
          bodyGoals: userPreferences.body_goal ? [userPreferences.body_goal] : [],
          healthGoals: userPreferences.health_goals || [],
          dietGoals: userPreferences.diet_type ? [userPreferences.diet_type] : [],
          accomplishmentGoals: userPreferences.accomplish_future || [],
          hasCompletedOnboarding: userPreferences.hasCompletedOnboarding || false,
          profilePicture: userPreferences.profilePicture
        };
        
        const scoringResult = scoreProduct(product, userProfile);
        
        console.log(`Product scored: ${scoringResult.final_score}/100 (v${scoringResult.score_version})`);
        console.log('Scoring components:', scoringResult.components);
        console.log('Scoring explanation:', scoringResult.notes[1]);
        
        // Add to history with scoring information
        addToHistory({
          barcode: data,
          product: product,
          scannedAt: new Date().toISOString(),
          score: scoringResult.final_score,
          reasons: [scoringResult.notes[1] || 'Personalized score calculated']
        });
        
        // Navigate to product details
        router.push(`/product/${data}` as any);
      } else {
        Alert.alert(
          "Product Not Found",
          `We couldn't find this product (${data}) in our database. This might be because:\n\n• The product is new or not widely distributed\n• The barcode might be damaged or unclear\n• It might be a store-specific or regional product\n\nTry scanning another product or check if the barcode is clear and complete.`,
          [{ text: "OK", onPress: () => {
            setScanned(false);
            setIsProcessing(false);
          }}]
        );
      }
      
    } catch (error) {
      console.error('Error processing barcode:', error);
      Alert.alert(
        "Error",
        "Failed to fetch product information. Please check your internet connection and try again.",
        [{ text: "OK", onPress: () => {
          setScanned(false);
          setIsProcessing(false);
        }}]
      );
    }
  };

  const toggleTorch = () => {
    setTorchOn(!torchOn);
  };

  const handleManualEntry = () => {
    Alert.prompt(
      "Manual Barcode Entry",
      "Enter the barcode number:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Search",
          onPress: (barcode) => {
            if (barcode) {
              handleBarCodeScanned({ type: "manual", data: barcode });
            }
          },
        },
      ],
      "plain-text"
    );
  };

  if (Platform.OS === "web") {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#FF3B30", "#FF6B5A"]}
          style={styles.webContainer}
        >
          <Package size={80} color="white" style={{ marginBottom: 24 }} />
          <Text style={styles.webTitle}>Barcode Scanner</Text>
          <Text style={styles.webText}>
            Barcode scanning is only available on mobile devices.
            {"\n"}Please use the RawScan mobile app to scan products.
          </Text>
          <TouchableOpacity 
            style={styles.webButton}
            onPress={() => {
              // Use a sample barcode for demo (Nutella)
              handleBarCodeScanned({ type: "demo", data: "3017620422003" });
            }}
          >
            <Text style={styles.webButtonText}>Try Demo Product</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.webButton, { marginTop: 16, backgroundColor: "rgba(255, 255, 255, 0.1)" }]}
            onPress={async () => {
              try {
                console.log('Testing backend connection...');
                
                // First test basic HTTP connectivity
                const baseUrl = 'https://awroo30hww4zvdjwpwrgm.rork.com';
                console.log('Testing base URL:', baseUrl);
                
                const healthResponse = await fetch(`${baseUrl}/api/`);
                console.log('Health check response:', {
                  status: healthResponse.status,
                  ok: healthResponse.ok,
                  statusText: healthResponse.statusText
                });
                
                if (!healthResponse.ok) {
                  const text = await healthResponse.text();
                  console.log('Health check response body:', text.substring(0, 200));
                  Alert.alert('Backend Health Check Failed', `Status: ${healthResponse.status}\nResponse: ${text.substring(0, 100)}...`);
                  return;
                }
                
                const healthData = await healthResponse.json();
                console.log('Health check data:', healthData);
                
                // Now test tRPC
                const result = await trpcClient.example.hi.query();
                Alert.alert('Backend Test Success', `Health: ${healthData.status}\ntRPC: ${result.hello}`);
              } catch (error) {
                console.error('Backend test failed:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                Alert.alert('Backend Test Failed', `Error: ${errorMessage}`);
              }
            }}
          >
            <Text style={styles.webButtonText}>Test Backend Connection</Text>
          </TouchableOpacity>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torchOn}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "code93", "itf14", "datamatrix", "pdf417"],
        }}
      />
      
      <SafeAreaView style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scan Product</Text>
          <Text style={styles.headerSubtitle}>
            Point camera at barcode
          </Text>
          <Text style={styles.brandTitle}>RawScan</Text>
        </View>

        <View style={styles.scanArea}>
          <View style={styles.scanFrame}>
            <View style={styles.scanRectangle}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            
            {isProcessing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color="#FF3B30" />
                <Text style={styles.processingText}>Analyzing product...</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={toggleTorch}
            testID="torch-button"
          >
            {torchOn ? (
              <FlashlightOff size={24} color="white" />
            ) : (
              <Flashlight size={24} color="white" />
            )}
            <Text style={styles.controlText}>
              {torchOn ? "Light Off" : "Light On"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={handleManualEntry}
            testID="manual-entry-button"
          >
            <Package size={24} color="white" />
            <Text style={styles.controlText}>Manual Entry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#FFFFFF",
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  grantButton: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  grantButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    alignItems: "flex-start",
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 8,
    alignSelf: "center",
    width: "100%",
    textAlign: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    alignSelf: "center",
    width: "100%",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    alignSelf: "center",
    width: "100%",
    textAlign: "center",
  },
  scanArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  scanFrame: {
    width: width * 0.7,
    height: width * 0.7,
    justifyContent: "center",
    alignItems: "center",
  },
  scanRectangle: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#FF3B30",
    borderWidth: 4,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  processingOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  processingText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 12,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  controlButton: {
    alignItems: "center",
    padding: 16,
  },
  controlText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginTop: 8,
  },
  webContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  webTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  webText: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 28,
  },
  webButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  webButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});