import { Stack } from "expo-router";
import React from "react";

export default function LearnLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#FFFFFF",
        },
        headerTintColor: "#1F2937",
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Learn & Tips",
        }}
      />
      <Stack.Screen
        name="article/[id]"
        options={{
          title: "Article",
        }}
      />
    </Stack>
  );
}