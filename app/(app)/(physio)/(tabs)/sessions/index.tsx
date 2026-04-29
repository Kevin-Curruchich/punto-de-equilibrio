import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { APP_ROUTES, APP_ROUTE_PATHNAMES } from "@/src/constants/routes";
import { usePhysioSessions } from "@/src/features/sessions/hooks";
import { useAuthStore } from "@/src/store/auth";
import dayjs from "dayjs";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PhysioSessionsTabScreen() {
  const user = useAuthStore((state) => state.user);
  const physiotherapistId = user?.id ?? null;
  const sessionsQuery = usePhysioSessions(physiotherapistId);
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const filteredSessions = useMemo(() => {
    const items = sessionsQuery.data ?? [];
    const term = search.trim().toLowerCase();

    if (!term) {
      return items;
    }

    return items.filter((item) => {
      const haystack = [
        item.patientName ?? "",
        item.conditionName ?? "",
        item.notes ?? "",
        item.date,
        item.status,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [search, sessionsQuery.data]);

  return (
    <Box
      className="flex-1 bg-background px-4"
      style={{ paddingTop: insets.top }}
    >
      <Heading size="3xl">Sesiones</Heading>
      <Text className="mb-4 mt-1 text-muted-foreground">
        Historial general de sesiones del fisioterapeuta.
      </Text>

      <Input className="bg-card">
        <InputField
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por paciente, diagnóstico o estado"
        />
      </Input>

      <Button
        className="mt-3"
        onPress={() => router.push(APP_ROUTES.physioSessionsNew)}
      >
        <ButtonText>+ Agendar sesión</ButtonText>
      </Button>

      {sessionsQuery.isLoading ? (
        <VStack className="mt-6 items-center" space="sm">
          <Spinner />
          <Text className="text-muted-foreground">Cargando sesiones...</Text>
        </VStack>
      ) : sessionsQuery.isError ? (
        <Box className="mt-6 rounded-lg border border-border bg-card p-4">
          <Text className="text-sm text-destructive">
            No se pudieron cargar las sesiones.
          </Text>
        </Box>
      ) : (
        <FlatList
          data={filteredSessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingTop: 14,
            paddingBottom: insets.bottom + 24,
            rowGap: 10,
          }}
          ListEmptyComponent={
            <Text className="mt-6 text-center text-muted-foreground">
              No se encontraron sesiones con esa búsqueda.
            </Text>
          }
          renderItem={({ item: session }) => {
            const statusLabel =
              session.status === "completed"
                ? "Completada"
                : session.status === "cancelled"
                  ? "Cancelada"
                  : "Agendada";

            return (
              <Box className="rounded-lg border border-border bg-card p-4">
                <VStack space="xs">
                  <Text className="text-sm font-semibold text-foreground">
                    {dayjs(session.date).format("DD/MM/YYYY")} · {statusLabel}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Paciente: {session.patientName ?? "Sin nombre"}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Diagnóstico: {session.conditionName}
                  </Text>
                  {session.notes ? (
                    <Text className="text-xs text-muted-foreground">
                      Nota: {session.notes}
                    </Text>
                  ) : null}
                </VStack>

                <Button
                  className="mt-3"
                  variant="outline"
                  onPress={() =>
                    router.push({
                      pathname: APP_ROUTE_PATHNAMES.physioSessionDetail,
                      params: { id: session.id },
                    })
                  }
                >
                  <ButtonText>Ver sesión</ButtonText>
                </Button>
              </Box>
            );
          }}
        />
      )}
    </Box>
  );
}
