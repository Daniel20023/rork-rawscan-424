import { Stack } from "expo-router";

export default function HistoryLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "Scan History",
          headerStyle: {
            backgroundColor: "#FFFFFF",
          },
          headerTintColor: "#111827",
          headerTitleStyle: {
            fontWeight: "700",
          },
        }} 
      />
    </Stack>
  );
}