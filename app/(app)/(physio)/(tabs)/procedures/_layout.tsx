import { Stack } from "expo-router";

export default function ProceduresStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="editor"
        options={{
          headerShown: true,
          title: "Procedimiento",
        }}
      />
    </Stack>
  );
}
