import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { APP_ROUTES } from "@/src/constants/routes";
import {
  useAvailableProcedures,
  useSeedPublicProcedures,
} from "@/src/features/procedures/hooks";
import { useAuthStore } from "@/src/store/auth";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function normalizeForSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function PhysioProceduresScreen() {
  const user = useAuthStore((state) => state.user);
  const physiotherapistId = user?.id ?? null;
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState("");

  const proceduresQuery = useAvailableProcedures(physiotherapistId, search);
  const seedPublicProceduresMutation = useSeedPublicProcedures();

  const hasExactMatch = useMemo(() => {
    const normalizedSearch = normalizeForSearch(search);
    if (!normalizedSearch || !proceduresQuery.data) {
      return false;
    }

    return proceduresQuery.data.some(
      (item) => normalizeForSearch(item.name) === normalizedSearch,
    );
  }, [proceduresQuery.data, search]);

  const showCreateCTA = search.trim().length > 0 && !hasExactMatch;

  return (
    <Box
      className="flex-1 bg-background px-4"
      style={{ paddingTop: insets.top }}
    >
      <Heading size="3xl">Procedimientos</Heading>
      <Text className="mb-4 mt-1 text-muted-foreground">
        Busca en el catálogo público y tus procedimientos.
      </Text>

      <Button
        variant="outline"
        onPress={() => seedPublicProceduresMutation.mutate()}
        disabled={seedPublicProceduresMutation.isPending}
      >
        {seedPublicProceduresMutation.isPending ? (
          <Spinner size="small" />
        ) : (
          <ButtonText>Cargar catálogo base público</ButtonText>
        )}
      </Button>

      <Input className="mt-3 bg-card">
        <InputField
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar procedimiento (ej: TENS, terapia manual)"
        />
      </Input>

      {proceduresQuery.isLoading ? (
        <VStack className="mt-6 items-center" space="sm">
          <Spinner />
          <Text className="text-muted-foreground">
            Cargando procedimientos...
          </Text>
        </VStack>
      ) : (
        <FlatList
          data={proceduresQuery.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingTop: 14,
            paddingBottom: insets.bottom + 24,
            rowGap: 10,
          }}
          ListEmptyComponent={
            <Text className="mt-6 text-center text-muted-foreground">
              No se encontraron procedimientos para esa búsqueda.
            </Text>
          }
          ListFooterComponent={
            showCreateCTA ? (
              <Box className="mt-6 rounded-xl border border-border bg-card p-4">
                <Heading size="md">No está en el catálogo.</Heading>
                <Text className="mt-1 text-sm text-muted-foreground">
                  Crea el procedimiento en la pantalla de alta para usarlo en
                  sesiones.
                </Text>

                <Button
                  className="mt-4"
                  onPress={() =>
                    router.push({
                      pathname: APP_ROUTES.physioProceduresEditor,
                      params: { initialName: search.trim() },
                    })
                  }
                >
                  <ButtonText>
                    Crear procedimiento &quot;{search.trim()}&quot;
                  </ButtonText>
                </Button>
              </Box>
            ) : null
          }
          renderItem={({ item: procedure }) => (
            <Box className="rounded-xl border border-border bg-card p-4">
              <HStack className="items-center justify-between">
                <Text className="text-base font-semibold text-foreground">
                  {procedure.name}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {procedure.isPublic ? "Público" : "Propio"}
                </Text>
              </HStack>

              {procedure.category ? (
                <Text className="mt-1 text-sm text-muted-foreground">
                  Categoría: {procedure.category}
                </Text>
              ) : null}

              {procedure.description ? (
                <Text className="mt-2 text-sm text-muted-foreground">
                  {procedure.description}
                </Text>
              ) : null}

              {!procedure.isPublic &&
              procedure.createdById === physiotherapistId ? (
                <Button
                  className="mt-3 self-start"
                  variant="outline"
                  onPress={() =>
                    router.push({
                      pathname: APP_ROUTES.physioProceduresEditor,
                      params: { procedureId: procedure.id },
                    })
                  }
                >
                  <ButtonText>Editar procedimiento propio</ButtonText>
                </Button>
              ) : null}
            </Box>
          )}
        />
      )}
    </Box>
  );
}
