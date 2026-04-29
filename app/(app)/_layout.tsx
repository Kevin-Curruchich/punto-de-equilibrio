import { useAuthStore } from "@/src/store/auth";
import { Redirect, Stack, useSegments } from "expo-router";

export default function AppLayout() {
  const status = useAuthStore((state) => state.status);
  const role = useAuthStore((state) => state.role);
  const segments = useSegments();

  if (status !== "authenticated") {
    return <Redirect href="/(auth)/login" />;
  }

  const isPhysioRole = role === "physiotherapist" || role === "admin";
  const target = isPhysioRole ? "(physio)" : "(patient)";
  const inTargetGroup = segments[1] === target;

  if (!inTargetGroup) {
    const targetHref = isPhysioRole
      ? "/(app)/(physio)/(tabs)"
      : "/(app)/(patient)";
    return <Redirect href={targetHref} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(physio)" />
      <Stack.Screen name="(patient)" />
    </Stack>
  );
}
