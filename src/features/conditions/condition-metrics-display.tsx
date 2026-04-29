import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useConditionMetrics } from "@/src/features/conditions/api";
import type { Metric, UUID } from "@/src/types/domain";
import { useMemo } from "react";
import { ScrollView } from "react-native";

interface ConditionMetricsDisplayProps {
  conditionId: UUID;
  onSelectMetric: (metric: Metric) => void;
}

/**
 * Displays pre-defined metrics for a condition and allows quick recording
 * of measurements. This helps users understand what metrics are being tracked.
 */
export function ConditionMetricsDisplay({
  conditionId,
  onSelectMetric,
}: ConditionMetricsDisplayProps) {
  const { data: metrics = [], isLoading } = useConditionMetrics(conditionId);

  const metricsWithValues = useMemo(() => {
    return metrics.map((metric) => ({
      ...metric,
      progressRange: getProgressPercentage(
        metric.initialValue,
        metric.targetValue,
      ),
    }));
  }, [metrics]);

  if (isLoading) {
    return (
      <VStack space="md">
        <Text className="text-xs text-muted-foreground animate-pulse">
          Cargando métricas...
        </Text>
      </VStack>
    );
  }

  if (metrics.length === 0) {
    return (
      <Box className="rounded-lg border border-dashed border-border bg-card/50 p-4">
        <VStack space="xs">
          <Text className="text-sm font-semibold text-muted-foreground">
            Sin métricas definidas
          </Text>
          <Text className="text-xs text-muted-foreground">
            Define métricas al crear o editar el diagnóstico para rastrear el
            progreso.
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <VStack space="md">
      <Text className="text-sm font-semibold text-foreground">
        Métricas del diagnóstico
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
      >
        {metricsWithValues.map((metric) => (
          <Button
            key={metric.id}
            variant="outline"
            size="sm"
            onPress={() => onSelectMetric(metric as Metric)}
            className="min-w-max"
          >
            <VStack space="xs" className="items-center py-1">
              <Text className="text-xs font-semibold text-foreground">
                {metric.name}
              </Text>
              <HStack space="xs" className="items-center">
                <Text className="text-xs text-muted-foreground">
                  {metric.initialValue} {metric.unit}
                </Text>
                <Text className="text-xs text-muted-foreground">→</Text>
                <Text className="text-xs font-semibold text-accent">
                  {metric.targetValue} {metric.unit}
                </Text>
              </HStack>
            </VStack>
          </Button>
        ))}
      </ScrollView>
    </VStack>
  );
}

/**
 * Helper function to calculate progress percentage
 */
function getProgressPercentage(
  initialValue: number | null,
  targetValue: number | null,
): number | null {
  if (
    initialValue === null ||
    initialValue === undefined ||
    targetValue === null ||
    targetValue === undefined
  ) {
    return null;
  }

  const range = Math.abs(targetValue - initialValue);
  if (range === 0) return 0;

  return Math.abs(100 - (Math.abs(targetValue) / Math.abs(initialValue)) * 100);
}
