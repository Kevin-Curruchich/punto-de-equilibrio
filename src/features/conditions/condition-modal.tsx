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
import type { ConditionStatus, UUID } from "@/src/types/domain";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { Controller, useForm } from "react-hook-form";
import { ScrollView } from "react-native";
import { z } from "zod";

const conditionFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  status: z.enum(["active", "resolved", "on_hold"]),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  endDate: z.string().optional().nullable(),
});

type ConditionFormInput = z.infer<typeof conditionFormSchema>;

interface ConditionModalContentProps {
  patientId: UUID;
  onClose: () => void;
  onSubmit: (data: ConditionFormInput) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function ConditionModalContent({
  patientId,
  onClose,
  onSubmit,
  isLoading = false,
  error = null,
}: ConditionModalContentProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
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

  const statusOptions: { label: string; value: ConditionStatus }[] = [
    { label: "Activo", value: "active" },
    { label: "Resuelto", value: "resolved" },
    { label: "En pausa", value: "on_hold" },
  ];

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 16,
      }}
      style={{ backgroundColor: "rgb(var(--background))" as never }}
    >
      <VStack space="lg">
        <VStack space="xs">
          <Text className="text-lg font-semibold text-foreground">
            Agregar diagnóstico
          </Text>
          <Text className="text-sm text-muted-foreground">
            Registra una nueva condición clínica para el paciente.
          </Text>
        </VStack>

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
          render={({ field: { value, onChange } }) => (
            <FormControl isInvalid={Boolean(errors.startDate)}>
              <FormControlLabel>
                <FormControlLabelText className="text-sm font-semibold text-foreground">
                  Fecha de inicio *
                </FormControlLabelText>
              </FormControlLabel>
              <Input className="border-border bg-card">
                <InputField
                  value={value}
                  onChangeText={onChange}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="rgb(var(--muted-foreground))"
                  className="text-foreground font-mono text-sm"
                />
              </Input>
              <Text className="text-xs text-muted-foreground mt-1">
                Formato: YYYY-MM-DD
              </Text>
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

        {/* Fecha de fin */}
        <Controller
          control={control}
          name="endDate"
          render={({ field: { value, onChange } }) => (
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText className="text-sm font-semibold text-foreground">
                  Fecha de fin (opcional)
                </FormControlLabelText>
              </FormControlLabel>
              <Input className="border-border bg-card">
                <InputField
                  value={value ?? ""}
                  onChangeText={(text) => onChange(text || null)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="rgb(var(--muted-foreground))"
                  className="text-foreground font-mono text-sm"
                />
              </Input>
              <Text className="text-xs text-muted-foreground mt-1">
                Déjalo vacío si la condición está en curso
              </Text>
            </FormControl>
          )}
        />

        {/* Estado */}
        <Controller
          control={control}
          name="status"
          render={({ field: { value, onChange } }) => (
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText className="text-sm font-semibold text-foreground">
                  Estado
                </FormControlLabelText>
              </FormControlLabel>
              <HStack space="sm">
                {statusOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={value === option.value ? "default" : "outline"}
                    onPress={() => onChange(option.value)}
                    className="flex-1"
                  >
                    <ButtonText>{option.label}</ButtonText>
                  </Button>
                ))}
              </HStack>
            </FormControl>
          )}
        />

        {/* Botones de acción */}
        <HStack space="md">
          <Button
            variant="outline"
            onPress={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            <ButtonText>Cancelar</ButtonText>
          </Button>
          <Button
            onPress={handleSubmit((data) =>
              onSubmit(data as ConditionFormInput),
            )}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <Spinner size="small" />
            ) : (
              <ButtonText>Crear diagnóstico</ButtonText>
            )}
          </Button>
        </HStack>
      </VStack>
    </ScrollView>
  );
}
