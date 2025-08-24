import { Stack } from "expo-router";

export default function FavoritesLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "Favorites",
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