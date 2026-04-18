import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useUpdateCondition } from "@/src/features/conditions/api";
import { PhotoGallery } from "@/src/features/conditions/photo-gallery";
import { PhotoPicker } from "@/src/features/conditions/photo-picker";
import type { Condition, UUID } from "@/src/types/domain";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { useState } from "react";
import { Alert, Platform } from "react-native";

interface DiagnosticDetailCardProps {
  condition: Condition;
  userId: UUID;
  relatedSessionsCount: number;
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

export function DiagnosticDetailCard({
  condition,
  userId,
  relatedSessionsCount,
}: DiagnosticDetailCardProps) {
  const updateConditionMutation = useUpdateCondition(condition.patientId);
  const [isEditingEndDate, setIsEditingEndDate] = useState(false);
  const [selectedEndDate, setSelectedEndDate] = useState(
    condition.endDate ?? dayjs().format("YYYY-MM-DD"),
  );

  const handleStartEditingEndDate = () => {
    setSelectedEndDate(condition.endDate ?? dayjs().format("YYYY-MM-DD"));
    setIsEditingEndDate(true);
  };

  const handleEndDateChange = (_event: unknown, nextDate?: Date) => {
    if (Platform.OS === "android" && nextDate) {
      setSelectedEndDate(dayjs(nextDate).format("YYYY-MM-DD"));
      return;
    }

    if (nextDate) {
      setSelectedEndDate(dayjs(nextDate).format("YYYY-MM-DD"));
    }
  };

  const handleSaveEndDate = async () => {
    try {
      await updateConditionMutation.mutateAsync({
        conditionId: condition.id,
        endDate: selectedEndDate,
      });
      setIsEditingEndDate(false);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "No se pudo guardar la fecha de fin",
      );
    }
  };

  return (
    <Box>
      <VStack
        space="md"
        className="p-4 bg-card rounded-lg border border-border"
      >
        <HStack className="items-start justify-between" space="md">
          <VStack space="xs" className="flex-1">
            <Text className="text-lg font-semibold text-foreground">
              {condition.name}
            </Text>
            <Text className="text-xs text-muted-foreground">
              Inicio: {dayjs(condition.startDate).format("DD MMM YYYY")}
            </Text>
            {condition.endDate ? (
              <Text className="text-xs text-muted-foreground">
                Fin: {dayjs(condition.endDate).format("DD MMM YYYY")}
              </Text>
            ) : null}
            {condition.description ? (
              <Text className="text-sm text-muted-foreground">
                {condition.description}
              </Text>
            ) : null}
          </VStack>
          <Box
            className={`rounded-full px-3 py-1 ${
              (STATUS_COLORS[condition.status] || STATUS_COLORS.active).bg
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                (STATUS_COLORS[condition.status] || STATUS_COLORS.active).text
              }`}
            >
              {STATUS_LABELS[condition.status] || condition.status}
            </Text>
          </Box>

          <Button
            variant="outline"
            size="sm"
            onPress={handleStartEditingEndDate}
          >
            <ButtonText>
              {condition.endDate ? "Actualizar Fecha Fin" : "Agregar Fecha Fin"}
            </ButtonText>
          </Button>
        </HStack>

        <Text className="text-xs text-muted-foreground">
          Sesiones relacionadas: {relatedSessionsCount}
        </Text>

        {isEditingEndDate ? (
          <VStack space="sm">
            <Button variant="outline" className="w-full items-start">
              <ButtonText>
                {dayjs(selectedEndDate).format("DD MMMM YYYY")}
              </ButtonText>
            </Button>

            <DateTimePicker
              value={dayjs(selectedEndDate).toDate()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleEndDateChange}
            />

            <HStack space="sm">
              <Button
                onPress={handleSaveEndDate}
                disabled={updateConditionMutation.isPending}
                className="flex-1"
              >
                {updateConditionMutation.isPending ? (
                  <Spinner size="small" />
                ) : null}
                <ButtonText>
                  {condition.endDate ? "Actualizar fecha" : "Guardar fecha"}
                </ButtonText>
              </Button>
              <Button
                variant="outline"
                onPress={() => setIsEditingEndDate(false)}
                disabled={updateConditionMutation.isPending}
                className="flex-1"
              >
                <ButtonText>Cancelar</ButtonText>
              </Button>
            </HStack>
          </VStack>
        ) : null}

        <VStack space="md">
          <Text className="text-sm font-semibold text-foreground">
            Fotos del diagnostico
          </Text>

          <PhotoPicker
            conditionId={condition.id}
            userId={userId}
            defaultViewType="general"
            onPhotoUploaded={() => {}}
            onError={() => {
              // Error toast/alert is handled inside PhotoPicker
            }}
          />

          <PhotoGallery
            conditionId={condition.id}
            currentUserId={userId}
            editable
          />
        </VStack>
      </VStack>
    </Box>
  );
}
