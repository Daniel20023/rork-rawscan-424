import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { Shield, Database, Eye, Trash2, Download, Lock } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PrivacyScreen() {
  const handleExportData = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const rawScanKeys = keys.filter(key => key.startsWith('rawscan_'));
      const data: Record<string, any> = {};
      
      for (const key of rawScanKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          data[key] = JSON.parse(value);
        }
      }
      
      Alert.alert(
        "Data Export",
        `Found ${Object.keys(data).length} data entries. In a real app, this would be downloaded as a JSON file.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to export data");
    }
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      "Delete All Data",
      "This will permanently delete all your scan history, favorites, preferences, and settings. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const rawScanKeys = keys.filter(key => key.startsWith('rawscan_'));
              await AsyncStorage.multiRemove(rawScanKeys);
              Alert.alert("Success", "All data has been deleted");
            } catch (error) {
              Alert.alert("Error", "Failed to delete data");
            }
          },
        },
      ]
    );
  };

  const privacyFeatures = [
    {
      icon: <Database size={24} color="#10B981" />,
      title: "Local Storage Only",
      description: "All your data is stored locally on your device. We don't upload your scan history or preferences to any servers.",
    },
    {
      icon: <Eye size={24} color="#3B82F6" />,
      title: "No Tracking",
      description: "We don't track your behavior, location, or personal information. Your privacy is completely protected.",
    },
    {
      icon: <Lock size={24} color="#8B5CF6" />,
      title: "Secure Processing",
      description: "Product analysis happens on your device. Barcode lookups use anonymous requests without personal identifiers.",
    },
  ];

  const dataTypes = [
    {
      type: "Scan History",
      description: "Products you've scanned and their timestamps",
      retention: "Stored until you delete them",
    },
    {
      type: "Favorites",
      description: "Products you've marked as favorites",
      retention: "Stored until you remove them",
    },
    {
      type: "User Preferences",
      description: "Your name, health goals, and dietary preferences",
      retention: "Stored until you change or delete them",
    },
    {
      type: "Notification Settings",
      description: "Your notification preferences and reminder times",
      retention: "Stored until you modify them",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Shield size={32} color="#FF3B30" />
          <Text style={styles.headerTitle}>Privacy & Data</Text>
          <Text style={styles.headerSubtitle}>
            Your privacy matters. Here's how we protect your data and what information we store.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Features</Text>
          {privacyFeatures.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                {feature.icon}
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data We Store</Text>
          <Text style={styles.sectionDescription}>
            All data is stored locally on your device and never shared with third parties.
          </Text>
          {dataTypes.map((data, index) => (
            <View key={index} style={styles.dataItem}>
              <View style={styles.dataHeader}>
                <Text style={styles.dataType}>{data.type}</Text>
                <Text style={styles.dataRetention}>{data.retention}</Text>
              </View>
              <Text style={styles.dataDescription}>{data.description}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Data Rights</Text>
          <View style={styles.rightsContainer}>
            <View style={styles.rightItem}>
              <Text style={styles.rightTitle}>Access</Text>
              <Text style={styles.rightDescription}>
                You can view all your data through the app interface at any time.
              </Text>
            </View>
            <View style={styles.rightItem}>
              <Text style={styles.rightTitle}>Export</Text>
              <Text style={styles.rightDescription}>
                Download a copy of all your data in a portable format.
              </Text>
            </View>
            <View style={styles.rightItem}>
              <Text style={styles.rightTitle}>Delete</Text>
              <Text style={styles.rightDescription}>
                Remove all your data permanently from the app.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleExportData}>
            <Download size={20} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Export My Data</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleDeleteAllData}
          >
            <Trash2 size={20} color="#EF4444" />
            <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
              Delete All Data
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Third-Party Services</Text>
          <View style={styles.serviceItem}>
            <Text style={styles.serviceTitle}>Product Database</Text>
            <Text style={styles.serviceDescription}>
              We use anonymous API calls to look up product information by barcode. No personal data is sent with these requests.
            </Text>
          </View>
          <View style={styles.serviceItem}>
            <Text style={styles.serviceTitle}>Image Sources</Text>
            <Text style={styles.serviceDescription}>
              Product images are loaded from external sources (like Unsplash) but no tracking data is shared.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact & Questions</Text>
          <View style={styles.contactCard}>
            <Text style={styles.contactText}>
              If you have questions about your privacy or data handling, you can find more information in our Learn section or contact our support team.
            </Text>
            <Text style={styles.contactNote}>
              Last updated: December 2024
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 12,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginTop: 12,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  featureItem: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  dataItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dataHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dataType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  dataRetention: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  dataDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  rightsContainer: {
    paddingHorizontal: 20,
  },
  rightItem: {
    marginBottom: 16,
  },
  rightTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  rightDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dangerButton: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3B82F6",
    marginLeft: 8,
  },
  dangerButtonText: {
    color: "#EF4444",
  },
  serviceItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: "#F9FAFB",
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF3B30",
  },
  contactText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  contactNote: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
});