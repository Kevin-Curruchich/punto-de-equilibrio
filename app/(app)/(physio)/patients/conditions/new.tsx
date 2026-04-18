import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { VStack } from "@/components/ui/vstack";
import { useCreateCondition } from "@/src/features/conditions/api";
import { PhotoGallery } from "@/src/features/conditions/photo-gallery";
import { PhotoPicker } from "@/src/features/conditions/photo-picker";
import { useAuthStore } from "@/src/store/auth";
import type { Condition, UUID } from "@/src/types/domain";
import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Platform, ScrollView } from "react-native";
import { z } from "zod";

const conditionFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  status: z.enum(["active", "resolved", "on_hold"]),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  endDate: z.string().optional().nullable(),
});

type ConditionFormInput = z.infer<typeof conditionFormSchema>;

export default function CreateConditionScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const { user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [createdCondition, setCreatedCondition] = useState<Condition | null>(
    null,
  );
  const [uploadedPhotosCount, setUploadedPhotosCount] = useState(0);
  const [photoViewType, setPhotoViewType] = useState("general");
  const [photoNotes, setPhotoNotes] = useState("");

  const createConditionMutation = useCreateCondition();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ConditionFormInput>({
    resolver: zodResolver(conditionFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "active",
      startDate: dayjs().format("YYYY-MM-DD"),
      endDate: null,
    },
  });

  const startDate = watch("startDate");
  const status = watch("status");

  if (!patientId) {
    return (
      <Box className="flex-1 items-center justify-center bg-background px-6">
        <VStack space="md" className="w-full max-w-105 items-center">
          <Text className="text-destructive">
            No se especificó el paciente.
          </Text>
          <Button variant="outline" onPress={() => router.back()}>
            <ButtonText>Volver</ButtonText>
          </Button>
        </VStack>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-destructive">No autenticado</Text>
      </Box>
    );
  }

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowStartDatePicker(false);
    }

    if (selectedDate) {
      setValue("startDate", dayjs(selectedDate).format("YYYY-MM-DD"));
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowEndDatePicker(false);
    }

    if (selectedDate) {
      setValue("endDate", dayjs(selectedDate).format("YYYY-MM-DD"));
    }
  };

  const handleClearEndDate = () => {
    setValue("endDate", null);
  };

  const onSubmit = async (data: ConditionFormInput) => {
    try {
      setError(null);
      const result = await createConditionMutation.mutateAsync({
        patientId: patientId as UUID,
        name: data.name,
        description: data.description,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
      });
      // Set created condition to show photo upload interface
      setCreatedCondition(result as unknown as Condition);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al crear diagnóstico",
      );
    }
  };

  const handlePhotoUploaded = () => {
    setUploadedPhotosCount((prev) => prev + 1);
    setError(null);
  };

  const handleFinish = () => {
    if (uploadedPhotosCount > 0) {
      Alert.alert(
        "¡Éxito!",
        `Diagnóstico creado con ${uploadedPhotosCount} foto(s)`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      );
    } else {
      router.back();
    }
  };

  // After condition creation, show photo upload interface
  if (createdCondition) {
    return (
      <Box className="flex-1 bg-background">
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            paddingBottom: 32,
          }}
        >
          <VStack space="lg">
            {/* Success Header */}
            <Box className="rounded-lg border border-green-600 bg-green-50 p-4">
              <Text className="text-lg font-bold text-green-900">
                ✅ Diagnóstico creado
              </Text>
              <Text className="mt-2 text-sm text-green-800">
                {createdCondition.name}
              </Text>
            </Box>

            {/* Photo Upload Section */}
            <VStack space="md">
              <Text className="text-lg font-semibold text-foreground">
                📸 Agregar fotos de diagnóstico
              </Text>
              <Text className="text-sm text-muted-foreground">
                Sube o toma fotos solo si lo necesitas. Puedes agregar 0, 1 o
                tantas fotos como quieras, incluyendo documentos de evaluación.
              </Text>

              <Box className="rounded-lg border border-border bg-card p-4">
                <VStack space="sm">
                  <Text className="text-sm font-semibold text-foreground">
                    Tipo de foto
                  </Text>

                  <HStack space="sm" className="flex-wrap">
                    {[
                      "general",
                      "frontal",
                      "lateral",
                      "dorsal",
                      "documento",
                    ].map((type) => (
                      <Button
                        key={type}
                        size="sm"
                        variant={photoViewType === type ? "default" : "outline"}
                        onPress={() => setPhotoViewType(type)}
                      >
                        <ButtonText>{type}</ButtonText>
                      </Button>
                    ))}
                  </HStack>

                  <FormControl>
                    <FormControlLabel>
                      <FormControlLabelText className="text-xs text-muted-foreground">
                        Tipo personalizado (opcional)
                      </FormControlLabelText>
                    </FormControlLabel>
                    <Input className="border-border bg-background">
                      <InputField
                        value={photoViewType}
                        onChangeText={setPhotoViewType}
                        placeholder="Ej: evaluación funcional"
                      />
                    </Input>
                  </FormControl>

                  <FormControl>
                    <FormControlLabel>
                      <FormControlLabelText className="text-xs text-muted-foreground">
                        Nota de la foto (opcional)
                      </FormControlLabelText>
                    </FormControlLabel>
                    <Textarea className="border-border bg-background">
                      <TextareaInput
                        value={photoNotes}
                        onChangeText={setPhotoNotes}
                        placeholder="Ej: hoja de evaluación inicial"
                        numberOfLines={2}
                      />
                    </Textarea>
                  </FormControl>
                </VStack>
              </Box>

              {/* Flexible uploader CTA */}
              <VStack space="md">
                <PhotoPicker
                  conditionId={createdCondition.id}
                  userId={user.id}
                  viewType={photoViewType.trim() || "general"}
                  notes={photoNotes.trim() || undefined}
                  onPhotoUploaded={handlePhotoUploaded}
                  onError={(error) => {
                    setError(error);
                  }}
                />
                <Text className="text-xs text-muted-foreground">
                  Fotos subidas en esta creación: {uploadedPhotosCount}
                </Text>
              </VStack>

              {/* Photo Gallery */}
              <Box className="mt-4">
                <PhotoGallery
                  conditionId={createdCondition.id}
                  currentUserId={user.id}
                  editable={true}
                />
              </Box>
            </VStack>

            {error && (
              <Box className="rounded-lg border border-destructive bg-destructive/5 p-3">
                <Text className="text-sm text-destructive">{error}</Text>
              </Box>
            )}

            {/* Action Buttons */}
            <HStack space="md" style={{ marginTop: 24 }}>
              <Button
                variant="outline"
                onPress={handleFinish}
                className="flex-1"
              >
                <ButtonText>Finalizar</ButtonText>
              </Button>
              <Button onPress={handleFinish} className="flex-1">
                <ButtonText>Finalizar y volver</ButtonText>
              </Button>
            </HStack>
          </VStack>
        </ScrollView>
      </Box>
    );
  }

  // Initial form to create condition

  return (
    <Box className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          paddingBottom: 32,
        }}
      >
        <VStack space="lg">
          {error && (
            <Box className="rounded-lg border border-destructive bg-destructive/5 p-3">
              <Text className="text-sm text-destructive">{error}</Text>
            </Box>
          )}

          {/* Nombre */}
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange } }) => (
              <FormControl isInvalid={Boolean(errors.name)}>
                <FormControlLabel>
                  <FormControlLabelText className="text-sm font-semibold text-foreground">
                    Nombre del diagnóstico *
                  </FormControlLabelText>
                </FormControlLabel>
                <Input className="border-border bg-card">
                  <InputField
                    value={value}
                    onChangeText={onChange}
                    placeholder="Ej: Lumbalgia, Esguince de tobillo"
                    placeholderTextColor="rgb(var(--muted-foreground))"
                    className="text-foreground"
                  />
                </Input>
                {errors.name && (
                  <FormControlError>
                    <FormControlErrorText className="text-xs text-destructive">
                      {errors.name.message}
                    </FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
            )}
          />

          {/* Descripción */}
          <Controller
            control={control}
            name="description"
            render={({ field: { value, onChange } }) => (
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText className="text-sm font-semibold text-foreground">
                    Descripción (opcional)
                  </FormControlLabelText>
                </FormControlLabel>
                <Textarea className="border-border bg-card">
                  <TextareaInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="Detalles adicionales sobre la condición"
                    placeholderTextColor="rgb(var(--muted-foreground))"
                    className="text-foreground"
                    numberOfLines={3}
                  />
                </Textarea>
              </FormControl>
            )}
          />

          {/* Fecha de inicio */}
          <Controller
            control={control}
            name="startDate"
            render={({ field: { value } }) => (
              <FormControl isInvalid={Boolean(errors.startDate)}>
                <FormControlLabel>
                  <FormControlLabelText className="text-sm font-semibold text-foreground">
                    Fecha de inicio *
                  </FormControlLabelText>
                </FormControlLabel>
                <Button
                  variant="outline"
                  onPress={() => setShowStartDatePicker(true)}
                  className="w-full items-start"
                >
                  <VStack space="xs" className="w-full">
                    <ButtonText className="text-left">
                      {dayjs(value).format("DD MMMM YYYY")}
                    </ButtonText>
                    <Text className="text-xs text-muted-foreground">
                      Toca para cambiar la fecha
                    </Text>
                  </VStack>
                </Button>

                {showStartDatePicker && (
                  <DateTimePicker
                    value={dayjs(value).toDate()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleStartDateChange}
                    maximumDate={new Date()}
                  />
                )}

                {errors.startDate && (
                  <FormControlError>
                    <FormControlErrorText className="text-xs text-destructive">
                      {errors.startDate.message}
                    </FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
            )}
          />

          {/* Botones de acción */}
          <HStack space="md" style={{ marginTop: 24 }}>
            <Button
              variant="outline"
              onPress={() => router.back()}
              disabled={createConditionMutation.isPending}
              className="flex-1"
            >
              <ButtonText>Cancelar</ButtonText>
            </Button>
            <Button
              onPress={handleSubmit((data) =>
                onSubmit(data as ConditionFormInput),
              )}
              disabled={createConditionMutation.isPending}
              className="flex-1"
            >
              {createConditionMutation.isPending ? (
                <Spinner size="small" />
              ) : (
                <ButtonText>Crear diagnóstico</ButtonText>
              )}
            </Button>
          </HStack>
        </VStack>
      </ScrollView>
    </Box>
  );
}
