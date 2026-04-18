import { Button, ButtonText } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { DiagnosticSummaryCard } from "@/src/features/conditions/diagnostic-summary-card";
import type { Condition, UUID } from "@/src/types/domain";
import { router } from "expo-router";
import { ScrollView } from "react-native";

interface PatientDiagnosticsTabProps {
  patientId: UUID;
  conditions: Condition[];
  isLoading: boolean;
}

export function PatientDiagnosticsTab({
  patientId,
  conditions,
  isLoading,
}: PatientDiagnosticsTabProps) {
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
            Diagnosticos y condiciones clinicas
          </Text>
        </VStack>

        <Button
          onPress={() => {
            router.push({
              pathname: "/patients/conditions/new",
              params: { patientId },
            });
          }}
          className="w-full"
        >
          <ButtonText>+ Agregar diagnostico</ButtonText>
        </Button>
      </VStack>

      {isLoading ? (
        <VStack space="sm" className="items-center py-8">
          <Spinner />
          <Text className="text-sm text-muted-foreground">
            Cargando diagnosticos...
          </Text>
        </VStack>
      ) : conditions.length === 0 ? (
        <VStack
          space="md"
          className="items-center rounded-lg border border-border bg-card px-4 py-8"
        >
          <Text className="text-center text-sm font-semibold text-foreground">
            Sin diagnosticos registrados
          </Text>
          <Text className="text-center text-xs text-muted-foreground">
            Agrega el primer diagnostico usando el boton de arriba.
          </Text>
        </VStack>
      ) : (
        <VStack space="md">
          {conditions.map((condition) => (
            <DiagnosticSummaryCard
              key={condition.id}
              condition={condition}
              onOpenDetail={() => {
                router.push({
                  pathname: "/patient/[id]/diagnostic/[conditionId]",
                  params: {
                    id: patientId,
                    conditionId: condition.id,
                  },
                });
              }}
            />
          ))}
        </VStack>
      )}
    </ScrollView>
  );
}
