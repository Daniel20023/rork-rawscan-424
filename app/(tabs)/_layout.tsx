import { Tabs } from "expo-router";
import { Scan, History, Heart, User, Search, BookOpen } from "lucide-react-native";
import React from "react";
import { Platform, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, BorderRadius, Shadows } from "@/constants/colors";
import { AuthGuard } from "@/components/AuthGuard";

const ScanTabIcon = ({ focused }: { focused: boolean }) => {
  if (focused) {
    return (
      <LinearGradient
        colors={Colors.gradients.lightRed as [string, string]}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: -8,
          ...Shadows.button,
        }}
      >
        <Scan size={28} color={Colors.neutral.white} strokeWidth={2.5} />
      </LinearGradient>
    );
  }
  
  return (
    <View
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.neutral.gray100,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Scan size={24} color={Colors.neutral.gray500} />
    </View>
  );
};

export default function TabLayout() {
  return (
    <AuthGuard>
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary.red,
        tabBarInactiveTintColor: Colors.neutral.gray400,
        tabBarStyle: {
          backgroundColor: Colors.background.primary,
          borderTopWidth: 0,
          paddingBottom: Platform.OS === "ios" ? 0 : 8,
          paddingTop: 12,
          height: Platform.OS === "ios" ? 96 : 76,
          ...Shadows.card,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="(scanner)"
        options={{
          title: "Scan",
          tabBarIcon: ({ focused }) => <ScanTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <History size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => <Search size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favorites",
          tabBarIcon: ({ color }) => <Heart size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: "Learn",
          tabBarIcon: ({ color }) => <BookOpen size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={22} color={color} strokeWidth={2} />,
        }}
      />
      </Tabs>
    </AuthGuard>
  );
}