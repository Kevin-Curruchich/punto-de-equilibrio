import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { APP_ROUTES, APP_ROUTE_PATHNAMES } from "@/src/constants/routes";
import type { PatientSessionListItem } from "@/src/services/firebase/sessions";
import dayjs from "dayjs";
import { router } from "expo-router";
import { ScrollView } from "react-native";

interface PatientVisitsTabProps {
  patientId: string;
  patientName: string;
  sessions: PatientSessionListItem[];
  isLoading: boolean;
  isError: boolean;
}

export function PatientVisitsTab({
  patientId,
  patientName,
  sessions,
  isLoading,
  isError,
}: PatientVisitsTabProps) {
  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingBottom: 32,
      }}
    >
      <VStack space="md" style={{ marginBottom: 16 }}>
        <VStack space="xs">
          <Text className="text-xs font-semibold uppercase text-muted-foreground">
            Historial de sesiones
          </Text>
        </VStack>

        <Button
          onPress={() => {
            router.push({
              pathname: APP_ROUTES.physioSessionsNew,
              params: {
                patientId,
                patientName,
              },
            });
          }}
          className="w-full"
        >
          <ButtonText>+ Agendar sesion</ButtonText>
        </Button>
      </VStack>

      {isLoading ? (
        <VStack space="sm" className="items-center py-8">
          <Spinner />
          <Text className="text-sm text-muted-foreground">
            Cargando sesiones...
          </Text>
        </VStack>
      ) : isError ? (
        <VStack
          space="md"
          className="items-center rounded-lg border border-border bg-card px-4 py-8"
        >
          <Text className="text-center text-sm font-semibold text-destructive">
            No se pudieron cargar las sesiones
          </Text>
        </VStack>
      ) : sessions.length === 0 ? (
        <VStack
          space="md"
          className="items-center rounded-lg border border-border bg-card px-4 py-8"
        >
          <Text className="text-center text-sm font-semibold text-foreground">
            Sin sesiones registradas
          </Text>
          <Text className="text-center text-xs text-muted-foreground">
            Agenda la primera sesion desde el boton de arriba.
          </Text>
        </VStack>
      ) : (
        <VStack space="md">
          {sessions.map((session) => {
            const statusLabel =
              session.status === "completed"
                ? "Completada"
                : session.status === "cancelled"
                  ? "Cancelada"
                  : "Agendada";
            const statusClassName =
              session.status === "completed"
                ? "text-success"
                : session.status === "cancelled"
                  ? "text-destructive"
                  : "text-warning";

            return (
              <Box
                key={session.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <VStack space="sm">
                  <VStack space="xs">
                    <Text className="text-sm font-semibold text-foreground">
                      {dayjs(session.date).format("DD/MM/YYYY")}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      Diagnostico: {session.conditionName}
                    </Text>
                    <Text
                      className={`text-xs font-semibold ${statusClassName}`}
                    >
                      Estado: {statusLabel}
                    </Text>
                    {session.durationMin ? (
                      <Text className="text-xs text-muted-foreground">
                        Duracion: {session.durationMin} min
                      </Text>
                    ) : null}
                    {session.notes ? (
                      <Text className="text-xs text-muted-foreground">
                        Nota: {session.notes}
                      </Text>
                    ) : null}
                  </VStack>

                  <Button
                    onPress={() =>
                      router.push({
                        pathname: APP_ROUTE_PATHNAMES.physioSessionDetail,
                        params: {
                          id: session.id,
                        },
                      })
                    }
                  >
                    <ButtonText>Abrir sesión completa</ButtonText>
                  </Button>
                </VStack>
              </Box>
            );
          })}
        </VStack>
      )}
    </ScrollView>
  );
}
