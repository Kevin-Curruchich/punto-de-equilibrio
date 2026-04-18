import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Link } from "expo-router";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";

interface AuthScreenShellProps {
  title: string;
  subtitle: string;
  footerHref: string;
  footerLabel: string;
  children: ReactNode;
}

export function AuthScreenShell({
  title,
  subtitle,
  footerHref,
  footerLabel,
  children,
}: AuthScreenShellProps) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Box className="flex-1 justify-center bg-background px-4">
        <Box className="rounded-2xl border border-border bg-card p-5">
          <VStack space="md">
            <VStack space="xs">
              <Heading size="2xl">{title}</Heading>
              <Text className="text-muted-foreground">{subtitle}</Text>
            </VStack>

            {children}

            <Link href={footerHref as never} asChild>
              <Pressable className="items-center py-1">
                <Text className="font-medium text-primary">{footerLabel}</Text>
              </Pressable>
            </Link>
          </VStack>
        </Box>
      </Box>
    </KeyboardAvoidingView>
  );
}
