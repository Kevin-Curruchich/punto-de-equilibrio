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
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { VStack } from "@/components/ui/vstack";
import {
  patientFormSchema,
  type PatientFormValues,
} from "@/src/lib/validation/patient";
import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Platform } from "react-native";

export const initialPatientFormValues: PatientFormValues = {
  name: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  medicalHistory: "",
};

interface PatientFormProps {
  initialValues?: PatientFormValues;
  submitLabel: string;
  submitPendingLabel: string;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (values: PatientFormValues) => Promise<void> | void;
  onCancel?: () => void;
  cancelLabel?: string;
}

function toPickerDate(value?: string) {
  if (!value) {
    return new Date(1990, 0, 1);
  }

  const parsed = dayjs(value, "YYYY-MM-DD", true);
  return parsed.isValid() ? parsed.toDate() : new Date(1990, 0, 1);
}

function formatBirthDate(value?: string) {
  if (!value) {
    return "Seleccionar fecha";
  }

  return dayjs(value).format("DD/MM/YYYY");
}

export function PatientForm({
  initialValues = initialPatientFormValues,
  submitLabel,
  submitPendingLabel,
  isSubmitting = false,
  errorMessage,
  onSubmit,
  onCancel,
  cancelLabel = "Cancelar",
}: PatientFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: initialValues,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const submitForm = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Box className="rounded-xl border border-border bg-card p-4">
      <VStack space="md">
        <FormControl isInvalid={Boolean(errors.name)}>
          <FormControlLabel>
            <FormControlLabelText>Nombre completo *</FormControlLabelText>
          </FormControlLabel>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input>
                <InputField
                  value={value ?? ""}
                  onChangeText={onChange}
                  placeholder="Nombre completo"
                />
              </Input>
            )}
          />
          {errors.name ? (
            <FormControlError>
              <FormControlErrorText>{errors.name.message}</FormControlErrorText>
            </FormControlError>
          ) : null}
        </FormControl>

        <FormControl isInvalid={Boolean(errors.email)}>
          <FormControlLabel>
            <FormControlLabelText>Correo</FormControlLabelText>
          </FormControlLabel>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input>
                <InputField
                  value={value ?? ""}
                  onChangeText={onChange}
                  placeholder="correo@dominio.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </Input>
            )}
          />
          {errors.email ? (
            <FormControlError>
              <FormControlErrorText>
                {errors.email.message}
              </FormControlErrorText>
            </FormControlError>
          ) : null}
        </FormControl>

        <FormControl isInvalid={Boolean(errors.phone)}>
          <FormControlLabel>
            <FormControlLabelText>Teléfono</FormControlLabelText>
          </FormControlLabel>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <Input>
                <InputField
                  value={value ?? ""}
                  onChangeText={onChange}
                  placeholder="Teléfono"
                  keyboardType="phone-pad"
                />
              </Input>
            )}
          />
          {errors.phone ? (
            <FormControlError>
              <FormControlErrorText>
                {errors.phone.message}
              </FormControlErrorText>
            </FormControlError>
          ) : null}
        </FormControl>

        <Controller
          control={control}
          name="dateOfBirth"
          render={({ field: { onChange, value } }) => {
            const handleDateChange = (
              event: DateTimePickerEvent,
              selectedDate?: Date,
            ) => {
              if (Platform.OS === "android") {
                setShowDatePicker(false);
              }

              if (event.type === "dismissed" || !selectedDate) {
                return;
              }

              onChange(dayjs(selectedDate).format("YYYY-MM-DD"));
            };

            return (
              <FormControl isInvalid={Boolean(errors.dateOfBirth)}>
                <FormControlLabel>
                  <FormControlLabelText>Fecha nacimiento</FormControlLabelText>
                </FormControlLabel>
                <Pressable onPress={() => setShowDatePicker(true)}>
                  <Box className="min-h-11 justify-center rounded-md border border-border bg-transparent px-3">
                    <Text
                      className={
                        value ? "text-foreground" : "text-muted-foreground"
                      }
                    >
                      {formatBirthDate(value)}
                    </Text>
                  </Box>
                </Pressable>
                {showDatePicker ? (
                  <Box className="mt-2 rounded-md border border-border bg-card p-2">
                    <DateTimePicker
                      value={toPickerDate(value)}
                      mode="date"
                      maximumDate={new Date()}
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={handleDateChange}
                    />
                    {Platform.OS === "ios" ? (
                      <Button
                        variant="outline"
                        className="mt-2"
                        onPress={() => setShowDatePicker(false)}
                      >
                        <ButtonText>Listo</ButtonText>
                      </Button>
                    ) : null}
                  </Box>
                ) : null}
                {errors.dateOfBirth ? (
                  <FormControlError>
                    <FormControlErrorText>
                      {errors.dateOfBirth.message}
                    </FormControlErrorText>
                  </FormControlError>
                ) : null}
              </FormControl>
            );
          }}
        />

        <FormControl isInvalid={Boolean(errors.medicalHistory)}>
          <FormControlLabel>
            <FormControlLabelText>Antecedentes médicos</FormControlLabelText>
          </FormControlLabel>
          <Controller
            control={control}
            name="medicalHistory"
            render={({ field: { onChange, value } }) => (
              <Textarea>
                <TextareaInput
                  value={value ?? ""}
                  onChangeText={onChange}
                  placeholder="Antecedentes médicos"
                />
              </Textarea>
            )}
          />
          {errors.medicalHistory ? (
            <FormControlError>
              <FormControlErrorText>
                {errors.medicalHistory.message}
              </FormControlErrorText>
            </FormControlError>
          ) : null}
        </FormControl>

        {errorMessage ? (
          <Text className="text-sm text-destructive">{errorMessage}</Text>
        ) : null}

        <HStack space="sm">
          {onCancel ? (
            <Button variant="outline" className="flex-1" onPress={onCancel}>
              <ButtonText>{cancelLabel}</ButtonText>
            </Button>
          ) : null}
          <Button
            className="flex-1"
            onPress={submitForm}
            disabled={isSubmitting}
          >
            <ButtonText>
              {isSubmitting ? submitPendingLabel : submitLabel}
            </ButtonText>
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
