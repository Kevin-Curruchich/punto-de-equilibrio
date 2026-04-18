import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import type { Condition } from "@/src/types/domain";
import dayjs from "dayjs";

interface DiagnosticSummaryCardProps {
  condition: Condition;
  onOpenDetail: () => void;
}

export function DiagnosticSummaryCard({
  condition,
  onOpenDetail,
}: DiagnosticSummaryCardProps) {
  const startDate = dayjs(condition.startDate).format("DD MMM YYYY");
  const endDate = condition.endDate
    ? dayjs(condition.endDate).format("DD MMM YYYY")
    : "Sin fecha";

  return (
    <Box className="rounded-lg border border-border bg-card p-4">
      <VStack space="md">
        <VStack space="xs">
          <Text className="text-lg font-semibold text-foreground">
            {condition.name}
          </Text>

          <Text className="text-sm text-muted-foreground" numberOfLines={3}>
            {condition.description || "Sin descripcion"}
          </Text>

          <Text className="text-xs text-muted-foreground">
            Inicio: {startDate}
          </Text>
          <Text className="text-xs text-muted-foreground">Fin: {endDate}</Text>
        </VStack>

        <Button onPress={onOpenDetail}>
          <ButtonText>Ver detalle</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
}
