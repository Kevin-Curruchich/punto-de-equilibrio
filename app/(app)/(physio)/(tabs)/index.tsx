import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { APP_ROUTES } from "@/src/constants/routes";
import { usePhysioPatients } from "@/src/features/patients/hooks";
import { usePhysioSessions } from "@/src/features/sessions/hooks";
import { useAuthStore } from "@/src/store/auth";
import dayjs from "dayjs";
import { router } from "expo-router";
import { useMemo } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PhysioHomeSummaryScreen() {
  const user = useAuthStore((state) => state.user);
  const physiotherapistId = user?.id ?? null;
  const insets = useSafeAreaInsets();

  const patientsQuery = usePhysioPatients(physiotherapistId);
  const sessionsQuery = usePhysioSessions(physiotherapistId);

  const summary = useMemo(() => {
    const sessions = sessionsQuery.data ?? [];
    const now = dayjs();
    const today = now.format("YYYY-MM-DD");

    const scheduled = sessions.filter((item) => item.status === "scheduled");
    const todaySessions = scheduled.filter((item) => item.date === today);
    const upcomingSessions = scheduled
      .filter(
        (item) =>
          dayjs(item.date).isSame(now, "day") ||
          dayjs(item.date).isAfter(now, "day"),
      )
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    const recentCompleted = sessions.filter(
      (item) =>
        item.status === "completed" &&
        dayjs(item.date).isAfter(now.subtract(7, "day"), "day"),
    );

    return {
      patientsCount: patientsQuery.data?.length ?? 0,
      scheduledCount: scheduled.length,
      todayCount: todaySessions.length,
      completedLast7Days: recentCompleted.length,
      nextSessions: upcomingSessions.slice(0, 3),
    };
  }, [patientsQuery.data, sessionsQuery.data]);

  return (
    <Box className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          paddingBottom: insets.bottom + 20,
        }}
      >
        <VStack space="md">
          <VStack space="xs">
            <Heading size="3xl">Home Fisio</Heading>
            <Text className="text-sm text-muted-foreground">
              Resumen general de pacientes, sesiones y actividad reciente.
            </Text>
          </VStack>

          <VStack space="sm">
            <Box className="rounded-xl border border-border bg-card p-4">
              <Text className="text-xs uppercase text-muted-foreground">
                Pacientes activos
              </Text>
              <Text className="mt-1 text-3xl font-bold text-foreground">
                {summary.patientsCount}
              </Text>
            </Box>

            <Box className="rounded-xl border border-border bg-card p-4">
              <Text className="text-xs uppercase text-muted-foreground">
                Sesiones agendadas
              </Text>
              <Text className="mt-1 text-3xl font-bold text-foreground">
                {summary.scheduledCount}
              </Text>
              <Text className="mt-1 text-xs text-muted-foreground">
                Hoy: {summary.todayCount} · Últimos 7 días completadas:{" "}
                {summary.completedLast7Days}
              </Text>
            </Box>
          </VStack>

          <Box className="rounded-xl border border-border bg-card p-4">
            <Text className="text-sm font-semibold text-foreground">
              Próximas sesiones
            </Text>

            {(sessionsQuery.data ?? []).length === 0 ? (
              <Text className="mt-2 text-sm text-muted-foreground">
                Aún no tienes sesiones registradas.
              </Text>
            ) : summary.nextSessions.length === 0 ? (
              <Text className="mt-2 text-sm text-muted-foreground">
                No hay sesiones próximas agendadas.
              </Text>
            ) : (
              <VStack space="xs" className="mt-2">
                {summary.nextSessions.map((session) => (
                  <Box
                    key={session.id}
                    className="rounded-md border border-border bg-background p-3"
                  >
                    <Text className="text-sm font-semibold text-foreground">
                      {dayjs(session.date).format("DD/MM/YYYY")}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {session.patientName ?? "Paciente"} ·{" "}
                      {session.conditionName}
                    </Text>
                  </Box>
                ))}
              </VStack>
            )}
          </Box>

          <VStack space="sm">
            <Button onPress={() => router.push(APP_ROUTES.physioSessionsNew)}>
              <ButtonText>Agendar nueva sesión</ButtonText>
            </Button>
            <Button
              variant="outline"
              onPress={() => router.push(APP_ROUTES.physioPatientsNew)}
            >
              <ButtonText>Registrar paciente</ButtonText>
            </Button>
          </VStack>

          {(patientsQuery.isLoading || sessionsQuery.isLoading) && (
            <Text className="text-xs text-muted-foreground">
              Actualizando resumen...
            </Text>
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
}
