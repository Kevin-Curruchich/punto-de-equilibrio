import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { signOutUser } from "@/src/services/firebase/auth";
import { router } from "expo-router";

export default function PhysioHomeScreen() {
  return (
    <Box className="flex-1 items-center justify-center bg-background px-5">
      <VStack className="w-full max-w-[420px]" space="md">
        <Heading size="2xl">Home Fisioterapeuta</Heading>
        <Text className="text-muted-foreground">
          Sprint 2: auth y navegación por rol activa.
        </Text>

        <Button
          size="lg"
          className="mt-2"
          onPress={() => router.push("/(app)/(physio)/patients")}
        >
          <ButtonText>Gestionar Pacientes</ButtonText>
        </Button>

        <Button
          size="lg"
          variant="outline"
          onPress={() => router.push("/(app)/(physio)/procedures")}
        >
          <ButtonText>Catálogo de Procedimientos</ButtonText>
        </Button>

        <Button
          size="lg"
          variant="outline"
          onPress={() => router.push("/(app)/(physio)/sessions/new")}
        >
          <ButtonText>Agendar Sesión</ButtonText>
        </Button>

        <Button variant="outline" size="lg" onPress={signOutUser}>
          <ButtonText>Cerrar Sesión</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
}
