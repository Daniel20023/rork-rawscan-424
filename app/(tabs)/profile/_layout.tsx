import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "Profile",
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