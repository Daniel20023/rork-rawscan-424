import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  Alert,
} from "react-native";
import { Bell, Clock, Target, TrendingUp } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface NotificationSettings {
  scanReminders: boolean;
  dailyTips: boolean;
  weeklyReports: boolean;
  goalAchievements: boolean;
  reminderTime: string;
}

const STORAGE_KEY = "rawscan_notification_settings";

export default function NotificationsScreen() {
  const [settings, setSettings] = useState<NotificationSettings>({
    scanReminders: true,
    dailyTips: false,
    weeklyReports: true,
    goalAchievements: true,
    reminderTime: "18:00",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading notification settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error("Error saving notification settings:", error);
      Alert.alert("Error", "Failed to save notification settings");
    }
  };

  const toggleSetting = (key: keyof NotificationSettings) => {
    if (key === "reminderTime") return;
    
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };
    saveSettings(newSettings);
  };

  const notificationTypes = [
    {
      key: "scanReminders" as keyof NotificationSettings,
      icon: <Bell size={24} color="#FF3B30" />,
      title: "Scan Reminders",
      description: "Get reminded to scan products before buying",
      enabled: settings.scanReminders,
    },
    {
      key: "dailyTips" as keyof NotificationSettings,
      icon: <Target size={24} color="#10B981" />,
      title: "Daily Health Tips",
      description: "Receive daily nutrition and wellness advice",
      enabled: settings.dailyTips,
    },
    {
      key: "weeklyReports" as keyof NotificationSettings,
      icon: <TrendingUp size={24} color="#3B82F6" />,
      title: "Weekly Reports",
      description: "Summary of your scanning activity and progress",
      enabled: settings.weeklyReports,
    },
    {
      key: "goalAchievements" as keyof NotificationSettings,
      icon: <Clock size={24} color="#8B5CF6" />,
      title: "Goal Achievements",
      description: "Celebrate when you reach health milestones",
      enabled: settings.goalAchievements,
    },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notification Settings</Text>
          <Text style={styles.headerSubtitle}>
            Choose what notifications you'd like to receive to stay on track with your health goals.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          {notificationTypes.map((type, index) => (
            <View key={type.key} style={styles.notificationItem}>
              <View style={styles.notificationLeft}>
                <View style={styles.iconContainer}>
                  {type.icon}
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{type.title}</Text>
                  <Text style={styles.notificationDescription}>
                    {type.description}
                  </Text>
                </View>
              </View>
              <Switch
                value={type.enabled}
                onValueChange={() => toggleSetting(type.key)}
                trackColor={{ false: "#E5E7EB", true: "#FF3B30" }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminder Time</Text>
          <View style={styles.timeContainer}>
            <View style={styles.timeItem}>
              <Clock size={20} color="#6B7280" />
              <Text style={styles.timeText}>
                Daily reminders at {settings.reminderTime}
              </Text>
            </View>
            <Text style={styles.timeNote}>
              Scan reminders will be sent at this time each day when enabled.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Notifications</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Privacy First</Text>
            <Text style={styles.infoText}>
              All notifications are generated locally on your device. We don't track your notification preferences or send data to external servers.
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Battery Optimization</Text>
            <Text style={styles.infoText}>
              Our notifications are designed to be battery-efficient and won't drain your device's power.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              const allEnabled = {
                ...settings,
                scanReminders: true,
                dailyTips: true,
                weeklyReports: true,
                goalAchievements: true,
              };
              saveSettings(allEnabled);
            }}
          >
            <Text style={styles.actionButtonText}>Enable All Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => {
              const allDisabled = {
                ...settings,
                scanReminders: false,
                dailyTips: false,
                weeklyReports: false,
                goalAchievements: false,
              };
              saveSettings(allDisabled);
            }}
          >
            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
              Disable All Notifications
            </Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
  },
  header: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#6B7280",
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
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  notificationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  notificationLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  timeContainer: {
    paddingHorizontal: 20,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  timeText: {
    fontSize: 16,
    color: "#1F2937",
    marginLeft: 12,
    fontWeight: "500",
  },
  timeNote: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: "#F9FAFB",
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF3B30",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: "#FF3B30",
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  actionButtonSecondary: {
    backgroundColor: "#F3F4F6",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  actionButtonTextSecondary: {
    color: "#6B7280",
  },
});