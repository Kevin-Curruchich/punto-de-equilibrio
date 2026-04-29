import { Stack } from "expo-router";

export default function SessionsStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "",
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          headerShown: true,
          title: "Nueva sesión",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          title: "Sesión",
        }}
      />
    </Stack>
  );
}
