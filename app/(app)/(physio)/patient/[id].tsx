import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TabView } from "@/components/ui/tab-view";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { usePatientConditions } from "@/src/features/conditions/api";
import { PatientBasicDataTab } from "@/src/features/patients/components/patient-basic-data-tab";
import { PatientDiagnosticsTab } from "@/src/features/patients/components/patient-diagnostics-tab";
import { PatientVisitsTab } from "@/src/features/patients/components/patient-visits-tab";
import {
  usePhysioPatient,
  useUpdatePatient,
} from "@/src/features/patients/hooks";
import {
  usePatientSessions,
  useUpdateSessionStatus,
} from "@/src/features/sessions/hooks";
import { useAuthStore } from "@/src/store/auth";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const physiotherapistId = user?.id ?? null;

  const patientId = typeof id === "string" ? id : null;

  const patientQuery = usePhysioPatient(physiotherapistId, patientId);
  const updatePatientMutation = useUpdatePatient(physiotherapistId);
  const conditionsQuery = usePatientConditions(patientId);
  const sessionsQuery = usePatientSessions(physiotherapistId, patientId);
  const updateSessionStatusMutation = useUpdateSessionStatus(
    physiotherapistId,
    patientId,
  );

  if (patientQuery.isLoading) {
    return (
      <Box className="flex-1 items-center justify-center bg-background px-6">
        <VStack space="sm" className="items-center">
          <Spinner />
          <Text className="text-muted-foreground">
            Cargando detalle del paciente...
          </Text>
        </VStack>
      </Box>
    );
  }

  if (patientQuery.isError || !patientQuery.data) {
    return (
      <Box className="flex-1 items-center justify-center bg-background px-6">
        <VStack space="md" className="w-full max-w-105 items-center">
          <Text className="text-destructive">
            No se pudo cargar el paciente.
          </Text>
          <Button variant="outline" onPress={() => router.back()}>
            <ButtonText>Volver</ButtonText>
          </Button>
        </VStack>
      </Box>
    );
  }

  const patient = patientQuery.data;
  const conditions = conditionsQuery.data ?? [];
  const sessions = sessionsQuery.data ?? [];

  const basicDataTab = useMemo(
    () =>
      patientId ? (
        <PatientBasicDataTab
          patient={patient}
          patientId={patientId}
          updatePatientMutation={updatePatientMutation}
        />
      ) : null,
    [patient, patientId, updatePatientMutation],
  );

  const diagnosticsTab = useMemo(
    () =>
      patientId ? (
        <PatientDiagnosticsTab
          patientId={patientId}
          conditions={conditions}
          isLoading={conditionsQuery.isLoading}
        />
      ) : null,
    [patientId, conditions, conditionsQuery.isLoading],
  );

  const recentVisitsTab = useMemo(
    () =>
      patientId ? (
        <PatientVisitsTab
          patientId={patientId}
          patientName={patient.name}
          sessions={sessions}
          isLoading={sessionsQuery.isLoading}
          isError={sessionsQuery.isError}
          isMutatingStatus={updateSessionStatusMutation.isPending}
          onUpdateStatus={async (sessionId, status) => {
            await updateSessionStatusMutation.mutateAsync({
              sessionId,
              status,
            });
          }}
        />
      ) : null,
    [
      patientId,
      patient.name,
      sessions,
      sessionsQuery.isLoading,
      sessionsQuery.isError,
      updateSessionStatusMutation,
    ],
  );

  return (
    <Box className="flex-1 bg-background">
      <Stack.Screen options={{ title: patient.name }} />
      <TabView
        tabs={[
          {
            id: "basic",
            label: "Datos básicos",
            content: basicDataTab,
          },
          {
            id: "diagnostics",
            label: `Diagnósticos (${conditions.length})`,
            content: diagnosticsTab,
          },
          {
            id: "visits",
            label: `Visitas (${sessions.length})`,
            content: recentVisitsTab,
          },
        ]}
        defaultTabId="basic"
      />
    </Box>
  );
}
