import { queryClient } from "@/src/lib/query-client";
import { subscribeToAuthState } from "@/src/services/firebase/auth";
import { useAuthStore } from "@/src/store/auth";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";

export const unstable_settings = {
  anchor: "(auth)",
};

export default function RootLayout() {
  const segments = useSegments();
  const status = useAuthStore((state) => state.status);
  const role = useAuthStore((state) => state.role);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    setLoading();

    const unsubscribe = subscribeToAuthState(({ user }) => {
      if (user) {
        setAuthenticated(user);
      } else {
        clearAuth();
      }
    });

    return unsubscribe;
  }, [clearAuth, setAuthenticated, setLoading]);

  useEffect(() => {
    const inAuthGroup = segments[0] === "(auth)";
    const inAppGroup = segments[0] === "(app)";

    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated" && !inAuthGroup) {
      router.replace("/(auth)/login");
      return;
    }

    if (status === "authenticated" && !inAppGroup) {
      const targetRole =
        role === "physiotherapist" || role === "admin" ? "physio" : "patient";
      router.replace(`/(app)/(${targetRole})`);
    }
  }, [role, segments, status]);

  return (
    <GluestackUIProvider>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        <StatusBar style="auto" />
      </QueryClientProvider>
    </GluestackUIProvider>
  );
}
