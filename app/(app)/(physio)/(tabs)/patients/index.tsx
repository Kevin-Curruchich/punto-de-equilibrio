import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { APP_ROUTES, APP_ROUTE_PATHNAMES } from "@/src/constants/routes";
import { usePhysioPatients } from "@/src/features/patients/hooks";
import { useAuthStore } from "@/src/store/auth";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return value;
}

export default function PhysioPatientsScreen() {
  const user = useAuthStore((state) => state.user);
  const physiotherapistId = user?.id ?? null;
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState("");

  const patientsQuery = usePhysioPatients(physiotherapistId);

  const filteredPatients = useMemo(() => {
    const items = patientsQuery.data ?? [];
    const term = search.trim().toLowerCase();

    if (!term) {
      return items;
    }

    return items.filter((item) => {
      const haystack = [item.name, item.email ?? "", item.phone ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [patientsQuery.data, search]);

  return (
    <Box
      className="flex-1 bg-background px-4"
      style={{ paddingTop: insets.top }}
    >
      <Heading size="3xl">Pacientes</Heading>
      <Text className="mb-4 mt-1 text-muted-foreground">
        Crear paciente y buscar en tu panel.
      </Text>

      <Input className="bg-card">
        <InputField
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre, correo o teléfono"
        />
      </Input>

      <Button
        className="mt-3"
        onPress={() => router.push(APP_ROUTES.physioPatientsNew)}
      >
        <ButtonText>Nuevo paciente</ButtonText>
      </Button>

      {patientsQuery.isLoading ? (
        <VStack className="mt-6 items-center" space="sm">
          <Spinner />
          <Text className="text-muted-foreground">Cargando pacientes...</Text>
        </VStack>
      ) : (
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingTop: 14,
            paddingBottom: insets.bottom + 24,
            rowGap: 10,
          }}
          ListEmptyComponent={
            <Text className="mt-6 text-center text-muted-foreground">
              No se encontraron pacientes con esa búsqueda.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              className="rounded-xl border border-border bg-card p-3"
              onPress={() =>
                router.push({
                  pathname: APP_ROUTE_PATHNAMES.physioPatientDetail,
                  params: { id: item.id },
                })
              }
            >
              <Text className="text-base font-bold text-foreground">
                {item.name}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {item.email ?? "Sin correo"}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {item.phone ?? "Sin teléfono"}
              </Text>
              <Text className="text-sm text-muted-foreground">
                Nacimiento: {formatDate(item.dateOfBirth)}
              </Text>
            </Pressable>
          )}
        />
      )}
    </Box>
  );
}
