import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import {
  useConditionById,
  usePatientConditions,
} from "@/src/features/conditions/api";
import { DiagnosticDetailCard } from "@/src/features/conditions/diagnostic-detail-card";
import { MetricsProgressView } from "@/src/features/conditions/metrics-progress-view";
import { usePatientSessions } from "@/src/features/sessions/hooks";
import { useAuthStore } from "@/src/store/auth";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DiagnosticDetailScreen() {
  const safeArea = useSafeAreaInsets();
  const { id, conditionId } = useLocalSearchParams<{
    id: string;
    conditionId: string;
  }>();

  const user = useAuthStore((state) => state.user);
  const physiotherapistId = user?.id ?? null;

  const patientId = typeof id === "string" ? id : null;
  const diagnosticId = typeof conditionId === "string" ? conditionId : null;

  const conditionQuery = useConditionById(diagnosticId);
  const conditionsQuery = usePatientConditions(patientId);
  const sessionsQuery = usePatientSessions(physiotherapistId, patientId);

  if (!patientId || !diagnosticId) {
    return (
      <Box className="flex-1 items-center justify-center bg-background px-6">
        <VStack space="md" className="w-full max-w-105 items-center">
          <Text className="text-destructive">
            Falta informacion del diagnostico.
          </Text>
          <Button variant="outline" onPress={() => router.back()}>
            <ButtonText>Volver</ButtonText>
          </Button>
        </VStack>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-destructive">No autenticado</Text>
      </Box>
    );
  }

  if (conditionQuery.isLoading || sessionsQuery.isLoading) {
    return (
      <Box className="flex-1 items-center justify-center bg-background px-6">
        <VStack space="sm" className="items-center">
          <Spinner />
          <Text className="text-muted-foreground">Cargando diagnostico...</Text>
        </VStack>
      </Box>
    );
  }

  const condition = conditionQuery.data;

  if (!condition || condition.patientId !== patientId) {
    return (
      <Box className="flex-1 items-center justify-center bg-background px-6">
        <VStack space="md" className="w-full max-w-105 items-center">
          <Text className="text-destructive">
            No se encontro el diagnostico solicitado.
          </Text>
          <Button variant="outline" onPress={() => router.back()}>
            <ButtonText>Volver</ButtonText>
          </Button>
        </VStack>
      </Box>
    );
  }

  const sessions = sessionsQuery.data ?? [];
  const relatedSessionsCount = sessions.filter(
    (session) => session.conditionId === condition.id,
  ).length;

  const liveCondition =
    conditionsQuery.data?.find((item) => item.id === condition.id) ?? condition;

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: safeArea.top, paddingBottom: safeArea.bottom }}
    >
      <Stack.Screen options={{ title: "Detalle de diagnostico" }} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack space="md">
          <DiagnosticDetailCard
            condition={liveCondition}
            userId={user.id}
            relatedSessionsCount={relatedSessionsCount}
          />
          <Box className="px-4">
            <MetricsProgressView conditionId={diagnosticId} />
          </Box>
        </VStack>
      </ScrollView>
    </View>
  );
}
