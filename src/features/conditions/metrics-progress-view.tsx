import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import {
  useConditionMeasurements,
  useConditionMetrics,
} from "@/src/features/conditions/api";
import type { UUID } from "@/src/types/domain";
import dayjs from "dayjs";
import { useMemo } from "react";

interface MetricsProgressViewProps {
  conditionId: UUID;
}

interface MetricProgress {
  metricName: string;
  unit: string | null;
  measurements: Array<{
    sessionDate: string;
    value: number;
    notes: string | null;
  }>;
}

/**
 * Displays metrics progress for a condition with measurement history
 * organized by date.
 */
export function MetricsProgressView({ conditionId }: MetricsProgressViewProps) {
  const { data: measurements = [], isLoading: isLoadingMeasurements } =
    useConditionMeasurements(conditionId);
  const { data: metrics = [] } = useConditionMetrics(conditionId);

  const metricProgressMap = useMemo(() => {
    const map = new Map<string, MetricProgress>();

    measurements.forEach((measurement) => {
      const key = measurement.metricName;
      if (!map.has(key)) {
        map.set(key, {
          metricName: measurement.metricName,
          unit: measurement.unit,
          measurements: [],
        });
      }

      const metric = map.get(key)!;
      metric.measurements.push({
        sessionDate: measurement.sessionDate,
        value: measurement.value,
        notes: measurement.notes,
      });
    });

    return map;
  }, [measurements]);

  const metricsWithProgress = useMemo(() => {
    return Array.from(metricProgressMap.values()).map((progress) => {
      const definedMetric = metrics.find((m) => m.name === progress.metricName);

      return {
        ...progress,
        definedMetric,
        progressPercentage: calculateProgressPercentage(
          definedMetric?.initialValue,
          definedMetric?.targetValue,
          progress.measurements[progress.measurements.length - 1]?.value,
        ),
      };
    });
  }, [metricProgressMap, metrics]);

  if (isLoadingMeasurements) {
    return (
      <VStack space="sm">
        <Text className="text-sm text-muted-foreground">
          Cargando progresos...
        </Text>
      </VStack>
    );
  }

  if (metricsWithProgress.length === 0) {
    return (
      <Box className="rounded-lg border border-border bg-card/50 p-4">
        <VStack space="xs">
          <Text className="text-sm font-semibold text-muted-foreground">
            Sin mediciones registradas
          </Text>
          <Text className="text-xs text-muted-foreground">
            Las mediciones de la sesión aparecerán aquí.
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <VStack space="lg">
      <VStack space="xs">
        <Text className="text-lg font-semibold text-foreground">
          Progreso de métricas
        </Text>
        <Text className="text-sm text-muted-foreground">
          Histórico de mediciones ordenadas por fecha
        </Text>
      </VStack>

      <VStack space="md">
        {metricsWithProgress.map((metric) => (
          <Box
            key={metric.metricName}
            className="rounded-lg border border-border bg-card p-4"
          >
            <VStack space="md">
              {/* Metric Header */}
              <VStack space="xs">
                <HStack className="items-baseline justify-between" space="sm">
                  <Text className="text-base font-semibold text-foreground">
                    {metric.metricName}
                  </Text>
                  {metric.definedMetric && (
                    <Text className="text-xs text-muted-foreground">
                      {metric.unit || "sin unidad"}
                    </Text>
                  )}
                </HStack>

                {/* Target Info */}
                {metric.definedMetric && (
                  <HStack className="items-center space-x-2">
                    <Text className="text-xs text-muted-foreground">
                      Meta: {metric.definedMetric.initialValue} →{" "}
                      {metric.definedMetric.targetValue}
                    </Text>
                    {metric.progressPercentage !== null && (
                      <Text className="text-xs font-semibold text-accent">
                        ({metric.progressPercentage.toFixed(0)}%)
                      </Text>
                    )}
                  </HStack>
                )}
              </VStack>

              {/* Measurements Timeline */}
              <VStack space="sm">
                {metric.measurements.map((measurement, index) => (
                  <Box
                    key={`${metric.metricName}-${index}`}
                    className="rounded-md bg-background/50 p-3"
                  >
                    <HStack className="items-center justify-between" space="sm">
                      <VStack space="xs" className="flex-1">
                        <Text className="text-xs text-muted-foreground">
                          {dayjs(measurement.sessionDate).format("DD MMM YYYY")}
                        </Text>
                        {measurement.notes && (
                          <Text className="text-xs text-muted-foreground italic">
                            {measurement.notes}
                          </Text>
                        )}
                      </VStack>
                      <Box className="items-end">
                        <Text className="text-lg font-bold text-foreground">
                          {measurement.value}
                        </Text>
                        {metric.unit && (
                          <Text className="text-xs text-muted-foreground">
                            {metric.unit}
                          </Text>
                        )}
                      </Box>
                    </HStack>
                  </Box>
                ))}
              </VStack>

              {/* Progress Bar */}
              {metric.definedMetric && (
                <ProgressBar
                  initialValue={metric.definedMetric.initialValue}
                  targetValue={metric.definedMetric.targetValue}
                  currentValue={
                    metric.measurements[metric.measurements.length - 1]?.value
                  }
                />
              )}
            </VStack>
          </Box>
        ))}
      </VStack>
    </VStack>
  );
}

/**
 * Simple progress bar component
 */
function ProgressBar({
  initialValue,
  targetValue,
  currentValue,
}: {
  initialValue: number | null;
  targetValue: number | null;
  currentValue?: number;
}) {
  if (
    initialValue === null ||
    initialValue === undefined ||
    targetValue === null ||
    targetValue === undefined
  ) {
    return null;
  }

  const range = Math.abs(targetValue - initialValue);
  const progress =
    currentValue !== undefined
      ? Math.abs(currentValue - initialValue) / (range || 1)
      : 0;

  const progressPercentage = Math.max(0, Math.min(100, progress * 100));

  return (
    <VStack space="xs">
      <HStack className="h-2 w-full rounded-full bg-border overflow-hidden">
        <Box
          className="h-full bg-accent rounded-full transition-all"
          style={{ width: `${progressPercentage}%` }}
        />
      </HStack>
      <HStack className="items-center justify-between">
        <Text className="text-xs text-muted-foreground">{initialValue}</Text>
        <Text className="text-xs font-semibold text-accent">
          {progressPercentage.toFixed(0)}%
        </Text>
        <Text className="text-xs text-muted-foreground">{targetValue}</Text>
      </HStack>
    </VStack>
  );
}

/**
 * Calculate progress percentage
 */
function calculateProgressPercentage(
  initialValue: number | null | undefined,
  targetValue: number | null | undefined,
  currentValue?: number,
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

  const progress =
    currentValue !== undefined
      ? Math.abs(currentValue - initialValue) / range
      : 0;

  return Math.max(0, Math.min(100, progress * 100));
}
