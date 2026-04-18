import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { signOutUser } from "@/src/services/firebase/auth";

export default function PatientHomeScreen() {
  return (
    <Box className="flex-1 items-center justify-center bg-background px-5">
      <VStack className="w-full max-w-[420px]" space="md">
        <Heading size="2xl">Home Paciente</Heading>
        <Text className="text-muted-foreground">
          Sprint 2: auth y navegación por rol activa.
        </Text>

        <Button variant="outline" size="lg" onPress={signOutUser}>
          <ButtonText>Cerrar Sesión</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
}
