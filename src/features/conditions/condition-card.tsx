import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import type { Condition } from "@/src/types/domain";
import dayjs from "dayjs";

interface ConditionCardProps {
  condition: Condition;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-accent/10", text: "text-accent" },
  resolved: { bg: "bg-green-100", text: "text-green-700" },
  on_hold: { bg: "bg-yellow-100", text: "text-yellow-700" },
};

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  resolved: "Resuelto",
  on_hold: "En pausa",
};

export function ConditionCard({ condition }: ConditionCardProps) {
  const statusConfig = STATUS_COLORS[condition.status] || STATUS_COLORS.active;
  const statusLabel = STATUS_LABELS[condition.status] || condition.status;

  const startDate = dayjs(condition.startDate).format("DD MMM YYYY");
  const endDate = condition.endDate
    ? dayjs(condition.endDate).format("DD MMM YYYY")
    : null;

  const duration = condition.endDate
    ? dayjs(condition.endDate).diff(dayjs(condition.startDate), "day") + " días"
    : "En seguimiento";

  return (
    <Box
      className="mb-3 rounded-lg border border-border bg-card p-4"
      style={{ borderRadius: 12 }}
    >
      <VStack space="md">
        {/* Header con nombre y estado */}
        <HStack
          className="items-start justify-between"
          space="md"
          style={{ flex: 1 }}
        >
          <VStack space="xs" style={{ flex: 1 }}>
            <Text
              className="text-lg font-semibold text-foreground"
              numberOfLines={2}
            >
              {condition.name}
            </Text>
            {condition.description && (
              <Text className="text-sm text-muted-foreground" numberOfLines={2}>
                {condition.description}
              </Text>
            )}
          </VStack>

          {/* Status badge */}
          <Box
            className={`rounded-full px-3 py-1 ${statusConfig.bg}`}
            style={{ borderRadius: 20 }}
          >
            <Text className={`text-xs font-medium ${statusConfig.text}`}>
              {statusLabel}
            </Text>
          </Box>
        </HStack>

        {/* Fechas */}
        <VStack space="xs">
          <HStack space="md">
            <Text className="text-xs font-semibold text-muted-foreground uppercase">
              Inicio:
            </Text>
            <Text className="text-sm text-foreground">{startDate}</Text>
          </HStack>

          {endDate && (
            <HStack space="md">
              <Text className="text-xs font-semibold text-muted-foreground uppercase">
                Fin:
              </Text>
              <Text className="text-sm text-foreground">{endDate}</Text>
            </HStack>
          )}

          <HStack space="md">
            <Text className="text-xs font-semibold text-muted-foreground uppercase">
              Duración:
            </Text>
            <Text className="text-sm text-foreground">{duration}</Text>
          </HStack>
        </VStack>
      </VStack>
    </Box>
  );
}
