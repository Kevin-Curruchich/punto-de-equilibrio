import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import type { PatientSessionListItem } from "@/src/services/firebase/sessions";
import dayjs from "dayjs";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView } from "react-native";

interface PatientVisitsTabProps {
  patientId: string;
  patientName: string;
  sessions: PatientSessionListItem[];
  isLoading: boolean;
  isError: boolean;
  isMutatingStatus: boolean;
  onUpdateStatus: (
    sessionId: string,
    status: "completed" | "cancelled",
  ) => Promise<void>;
}

export function PatientVisitsTab({
  patientId,
  patientName,
  sessions,
  isLoading,
  isError,
  isMutatingStatus,
  onUpdateStatus,
}: PatientVisitsTabProps) {
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(
    null,
  );

  const handleUpdateStatus = async (
    sessionId: string,
    status: "completed" | "cancelled",
  ) => {
    try {
      setPendingSessionId(sessionId);
      await onUpdateStatus(sessionId, status);
    } finally {
      setPendingSessionId(null);
    }
  };

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
              pathname: "/sessions/new",
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
            const isScheduled = session.status === "scheduled";
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
                    variant="outline"
                    onPress={() =>
                      setExpandedSessionId((prev) =>
                        prev === session.id ? null : session.id,
                      )
                    }
                  >
                    <ButtonText>
                      {expandedSessionId === session.id
                        ? "Ocultar detalle"
                        : "Ver detalle completo"}
                    </ButtonText>
                  </Button>

                  {expandedSessionId === session.id ? (
                    <VStack
                      space="sm"
                      className="rounded-md border border-border bg-background p-3"
                    >
                      <Text className="text-xs font-semibold uppercase text-muted-foreground">
                        Procedimientos de sesion
                      </Text>

                      {session.sessionProcedures.length === 0 ? (
                        <Text className="text-xs text-muted-foreground">
                          No hay procedimientos detallados en esta sesion.
                        </Text>
                      ) : (
                        <VStack space="xs">
                          {session.sessionProcedures.map((item, index) => (
                            <Box
                              key={`${session.id}-procedure-${index}`}
                              className="rounded-md border border-border bg-card p-2"
                            >
                              <Text className="text-xs text-foreground">
                                Procedimiento #{index + 1}
                              </Text>
                              <Text className="text-xs text-muted-foreground">
                                Sets: {item.sets ?? "-"} · Reps:{" "}
                                {item.reps ?? "-"} · Duracion:{" "}
                                {item.durationSec ?? "-"}s
                              </Text>
                              {item.instructions ? (
                                <Text className="text-xs text-muted-foreground">
                                  Nota: {item.instructions}
                                </Text>
                              ) : null}
                            </Box>
                          ))}
                        </VStack>
                      )}

                      <Text className="text-xs font-semibold uppercase text-muted-foreground">
                        Mediciones
                      </Text>

                      {session.measurements.length === 0 ? (
                        <Text className="text-xs text-muted-foreground">
                          No hay mediciones registradas.
                        </Text>
                      ) : (
                        <VStack space="xs">
                          {session.measurements.map((item, index) => (
                            <Box
                              key={`${session.id}-measurement-${index}`}
                              className="rounded-md border border-border bg-card p-2"
                            >
                              <Text className="text-xs text-foreground">
                                {item.metricName}: {item.value}
                                {item.unit ? ` ${item.unit}` : ""}
                              </Text>
                              {item.notes ? (
                                <Text className="text-xs text-muted-foreground">
                                  Nota: {item.notes}
                                </Text>
                              ) : null}
                            </Box>
                          ))}
                        </VStack>
                      )}
                    </VStack>
                  ) : null}

                  {isScheduled ? (
                    <VStack space="sm">
                      <Button
                        onPress={() =>
                          handleUpdateStatus(session.id, "completed")
                        }
                        disabled={
                          isMutatingStatus && pendingSessionId === session.id
                        }
                      >
                        <ButtonText>Marcar como completada</ButtonText>
                      </Button>
                      <Button
                        variant="outline"
                        onPress={() =>
                          handleUpdateStatus(session.id, "cancelled")
                        }
                        disabled={
                          isMutatingStatus && pendingSessionId === session.id
                        }
                      >
                        <ButtonText>Cancelar sesion</ButtonText>
                      </Button>
                    </VStack>
                  ) : null}
                </VStack>
              </Box>
            );
          })}
        </VStack>
      )}
    </ScrollView>
  );
}
