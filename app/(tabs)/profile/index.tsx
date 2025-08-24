import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { 
  Target, 
  TrendingUp, 
  Award, 
  Settings,
  ChevronRight,
  BarChart3,
  Heart,
  Clock,
  Bell,
  Shield,
  HelpCircle,
  Edit3,
  LogOut,
  Camera
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from 'expo-image-picker';
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { useProductHistory } from "@/contexts/ProductHistoryContext";
import { useAuth } from "@/contexts/AuthContext";
import { BackendStatus } from "@/components/BackendStatus";

export default function ProfileScreen() {
  const { body_goal, health_goals, accomplish_future, name, profilePicture, updateProfilePicture } = useUserPreferences();
  const { history, favorites } = useProductHistory();
  const { signOut, user } = useAuth();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Get display name with fallbacks
  const displayName = name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  
  const allGoals = [
    ...(body_goal ? [body_goal] : []),
    ...(health_goals || []),
    ...(accomplish_future || [])
  ];

  const getAverageScore = () => {
    if (history.length === 0) return 0;
    const scores = history.map(item => {
      // Handle both new Product type (nutriments) and legacy type (nutrition)
      const nutrition = 'nutrition' in item.product ? item.product.nutrition : {
        calories: item.product.nutriments.energyKcal || 0,
        sugar: item.product.nutriments.sugars || 0,
        protein: item.product.nutriments.protein || 0,
      };
      let score = 50;
      
      if (allGoals.includes("lose_weight")) {
        score -= (nutrition.calories - 200) / 10;
        score -= nutrition.sugar * 2;
      }
      if (allGoals.includes("low_sugar")) {
        score -= nutrition.sugar * 3;
      }
      if (allGoals.includes("high_protein")) {
        score += nutrition.protein * 2;
      }
      
      return Math.max(0, Math.min(100, score));
    });
    
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const averageScore = getAverageScore();
  const scoreColor = averageScore >= 70 ? "#FF3B30" : averageScore >= 40 ? "#FF8A80" : "#FFCDD2";

  const stats = [
    {
      icon: <BarChart3 size={20} color="#FF3B30" />,
      label: "Products Scanned",
      value: history.length.toString(),
      color: "#FF3B30",
    },
    {
      icon: <Heart size={20} color="#FF3B30" />,
      label: "Favorites",
      value: favorites.length.toString(),
      color: "#FF3B30",
    },
    {
      icon: <TrendingUp size={20} color={scoreColor} />,
      label: "Avg. Score",
      value: averageScore.toString(),
      color: scoreColor,
    },
  ];

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      router.replace('/auth');
    }
  };

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload a profile picture!');
        return;
      }
    }

    try {
      setIsUploadingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await updateProfilePicture(result.assets[0].uri);
        console.log('Profile picture updated successfully');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const menuItems = [
    {
      icon: <Edit3 size={20} color="#6B7280" />,
      label: "Edit Profile",
      onPress: () => router.push("/(tabs)/profile/edit-preferences" as any),
      description: "Update your name and preferences"
    },

    {
      icon: <Bell size={20} color="#6B7280" />,
      label: "Notifications",
      onPress: () => router.push("/(tabs)/profile/notifications" as any),
      description: "Scan reminders and health tips"
    },
    {
      icon: <Clock size={20} color="#6B7280" />,
      label: "Scan History",
      onPress: () => router.push("/(tabs)/history" as any),
      description: "View your scanning activity"
    },
    {
      icon: <Shield size={20} color="#6B7280" />,
      label: "Privacy & Data",
      onPress: () => router.push("/(tabs)/profile/privacy" as any),
      description: "How we handle your information"
    },
    {
      icon: <HelpCircle size={20} color="#6B7280" />,
      label: "Help & Support",
      onPress: () => router.push("/(tabs)/learn" as any),
      description: "FAQs and learning resources"
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={["#FF3B30", "#FF6B5A"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.profileInfo}>
          <Text style={styles.brandTitle}>RawScan</Text>
          <TouchableOpacity 
            style={styles.avatarContainer} 
            onPress={pickImage}
            disabled={isUploadingImage}
          >
            <View style={styles.avatar}>
              {profilePicture ? (
                <Image source={{ uri: profilePicture }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <View style={styles.cameraIcon}>
              <Camera size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.greeting}>Welcome {displayName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.goalsContainer}>
            {allGoals.slice(0, 3).map((goal, index) => (
              <View key={index} style={styles.goalBadge}>
                <Text style={styles.goalText}>
                  {goal.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>

      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.color + "20" }]}>
              {stat.icon}
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, index === menuItems.length - 1 && styles.lastMenuItem]}
            onPress={item.onPress}
            testID={`menu-item-${item.label}`}
          >
            <View style={styles.menuLeft}>
              {item.icon}
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
      </View>

      <BackendStatus showDetails={true} />
      
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>Weekly Insight</Text>
        <Text style={styles.insightText}>
          Your average health score has improved by 12% this week! Keep making great choices.
        </Text>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <LogOut size={20} color="#FF3B30" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  profileInfo: {
    alignItems: "center",
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 16,
    alignSelf: "flex-start",
    width: "100%",
    textAlign: "left",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  goalsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  goalBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  goalText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    marginTop: -20,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  menuContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 16,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  insightCard: {
    backgroundColor: "#FF3B3020",
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FF3B3040",
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF3B30",
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: "#B71C1C",
    lineHeight: 20,
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 12,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FF3B30",
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF3B30",
  },
});