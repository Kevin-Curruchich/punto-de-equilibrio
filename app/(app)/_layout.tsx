import { useAuthStore } from "@/src/store/auth";
import { Redirect, Stack, useSegments } from "expo-router";

export default function AppLayout() {
  const status = useAuthStore((state) => state.status);
  const role = useAuthStore((state) => state.role);
  const segments = useSegments();

  if (status !== "authenticated") {
    return <Redirect href="/(auth)/login" />;
  }

  const target =
    role === "physiotherapist" || role === "admin" ? "(physio)" : "(patient)";
  const inTargetGroup = segments[1] === target;

  if (!inTargetGroup) {
    return <Redirect href={`/(app)/${target}`} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(physio)" />
      <Stack.Screen name="(patient)" />
    </Stack>
  );
}
