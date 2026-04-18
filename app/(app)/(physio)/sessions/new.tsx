import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import {
  Checkbox,
  CheckboxGroup,
  CheckboxIndicator,
  CheckboxLabel,
} from "@/components/ui/checkbox";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import {
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { VStack } from "@/components/ui/vstack";
import { usePatientConditions } from "@/src/features/conditions/api";
import { usePhysioPatients } from "@/src/features/patients/hooks";
import { useAvailableProcedures } from "@/src/features/procedures/hooks";
import { useCreateScheduledSession } from "@/src/features/sessions/hooks";
import { useAuthStore } from "@/src/store/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Platform, ScrollView } from "react-native";
import { z } from "zod";

const sessionFormSchema = z.object({
  patientId: z.string().min(1, "Selecciona un paciente."),
  conditionId: z.string().min(1, "Selecciona un diagnóstico."),
  date: z.string().min(1, "La fecha es obligatoria."),
  durationMin: z.string().optional(),
  notes: z.string().optional(),
});

type SessionFormValues = z.infer<typeof sessionFormSchema>;

type SessionProcedureDraft = {
  sets: string;
  reps: string;
  durationSec: string;
  instructions: string;
};

export default function NewSessionScreen() {
  const params = useLocalSearchParams<{
    patientId?: string;
    patientName?: string;
  }>();
  const user = useAuthStore((state) => state.user);
  const physiotherapistId = user?.id ?? null;

  const preselectedPatientId =
    typeof params.patientId === "string" ? params.patientId : "";
  const preselectedPatientName =
    typeof params.patientName === "string" ? params.patientName : "";
  const isPatientPreselected = preselectedPatientId.length > 0;

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [procedureSearch, setProcedureSearch] = useState("");
  const [selectedProcedureIds, setSelectedProcedureIds] = useState<string[]>(
    [],
  );
  const [expandedProcedureId, setExpandedProcedureId] = useState<string | null>(
    null,
  );
  const [procedureDrafts, setProcedureDrafts] = useState<
    Record<string, SessionProcedureDraft>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const patientsQuery = usePhysioPatients(physiotherapistId);
  const createSessionMutation = useCreateScheduledSession(physiotherapistId);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      patientId: preselectedPatientId,
      conditionId: "",
      date: dayjs().format("YYYY-MM-DD"),
      durationMin: "",
      notes: "",
    },
  });

  const selectedPatientId = watch("patientId");
  const selectedConditionId = watch("conditionId");
  const selectedDate = watch("date");

  useEffect(() => {
    if (!preselectedPatientId) {
      return;
    }

    setValue("patientId", preselectedPatientId);
  }, [preselectedPatientId, setValue]);

  const conditionsQuery = usePatientConditions(selectedPatientId || null);
  const proceduresQuery = useAvailableProcedures(
    physiotherapistId,
    procedureSearch,
  );

  const filteredPatients = useMemo(() => {
    const list = patientsQuery.data ?? [];
    const term = patientSearch.trim().toLowerCase();

    if (!term) {
      return list;
    }

    return list.filter((item) => {
      const value = [item.name, item.email ?? "", item.phone ?? ""]
        .join(" ")
        .toLowerCase();
      return value.includes(term);
    });
  }, [patientsQuery.data, patientSearch]);

  const selectedPatient = (patientsQuery.data ?? []).find(
    (item) => item.id === selectedPatientId,
  );
  const selectedPatientName = selectedPatient?.name ?? preselectedPatientName;

  useEffect(() => {
    setProcedureDrafts((prev) => {
      const next: Record<string, SessionProcedureDraft> = {};

      selectedProcedureIds.forEach((procedureId) => {
        next[procedureId] = prev[procedureId] ?? {
          sets: "",
          reps: "",
          durationSec: "",
          instructions: "",
        };
      });

      return next;
    });

    if (
      expandedProcedureId &&
      !selectedProcedureIds.includes(expandedProcedureId)
    ) {
      setExpandedProcedureId(null);
    }
  }, [selectedProcedureIds, expandedProcedureId]);

  const selectedProcedures = useMemo(() => {
    const catalog = proceduresQuery.data ?? [];
    const byId = new Map(catalog.map((item) => [item.id, item]));
    return selectedProcedureIds
      .map((id) => byId.get(id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [proceduresQuery.data, selectedProcedureIds]);

  const updateProcedureDraft = (
    procedureId: string,
    field: keyof SessionProcedureDraft,
    value: string,
  ) => {
    setProcedureDrafts((prev) => ({
      ...prev,
      [procedureId]: {
        ...(prev[procedureId] ?? {
          sets: "",
          reps: "",
          durationSec: "",
          instructions: "",
        }),
        [field]: value,
      },
    }));
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSubmitError(null);

      const patientId = values.patientId || preselectedPatientId;
      if (!patientId) {
        throw new Error("Selecciona un paciente.");
      }

      const sessionProcedures = selectedProcedureIds.map((procedureId) => {
        const draft = procedureDrafts[procedureId];
        return {
          procedureId,
          sets: draft?.sets ? Number(draft.sets) : undefined,
          reps: draft?.reps ? Number(draft.reps) : undefined,
          durationSec: draft?.durationSec
            ? Number(draft.durationSec)
            : undefined,
          instructions: draft?.instructions?.trim() || undefined,
        };
      });

      await createSessionMutation.mutateAsync({
        patientId,
        conditionId: values.conditionId,
        date: values.date,
        durationMin: values.durationMin
          ? Number(values.durationMin)
          : undefined,
        notes: values.notes,
        procedureIds: selectedProcedureIds,
        sessionProcedures,
      });

      router.back();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "No se pudo agendar la sesión.",
      );
    }
  });

  return (
    <Box className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: "Nueva sesión",
        }}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 5,
          paddingBottom: 32,
        }}
      >
        <VStack space="lg" className="mt-6">
          <VStack space="sm">
            <Text className="text-sm font-semibold text-foreground">
              Paciente
            </Text>

            {!isPatientPreselected ? (
              <Input className="bg-card">
                <InputField
                  value={patientSearch}
                  onChangeText={setPatientSearch}
                  placeholder="Buscar paciente"
                />
              </Input>
            ) : null}

            {isPatientPreselected ? (
              <Box className="rounded-lg border border-border bg-card px-3 py-3">
                <Text className="text-sm font-semibold text-foreground">
                  {selectedPatientName || "Paciente seleccionado"}
                </Text>
                <Text className="mt-1 text-xs text-muted-foreground">
                  Esta sesión se está agendando desde el perfil del paciente.
                </Text>
              </Box>
            ) : patientsQuery.isLoading ? (
              <Spinner />
            ) : (
              <Select
                selectedValue={selectedPatientId}
                onValueChange={(value) => {
                  setValue("patientId", value);
                  setValue("conditionId", "");
                }}
              >
                <SelectTrigger variant="outline" size="md">
                  <SelectInput placeholder="Seleccionar paciente" />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    {filteredPatients.map((patient) => (
                      <SelectItem
                        key={patient.id}
                        label={patient.name}
                        value={patient.id}
                      />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
            )}

            {errors.patientId ? (
              <Text className="text-xs text-destructive">
                {errors.patientId.message}
              </Text>
            ) : null}
          </VStack>

          {selectedPatientId ? (
            <Controller
              control={control}
              name="conditionId"
              render={({ field: { onChange, value } }) => (
                <FormControl isInvalid={Boolean(errors.conditionId)}>
                  <FormControlLabel>
                    <FormControlLabelText>Diagnóstico *</FormControlLabelText>
                  </FormControlLabel>
                  {conditionsQuery.isLoading ? (
                    <Spinner />
                  ) : (
                    <Select selectedValue={value} onValueChange={onChange}>
                      <SelectTrigger variant="outline" size="md">
                        <SelectInput placeholder="Seleccionar diagnóstico" />
                      </SelectTrigger>
                      <SelectPortal>
                        <SelectBackdrop />
                        <SelectContent>
                          <SelectDragIndicatorWrapper>
                            <SelectDragIndicator />
                          </SelectDragIndicatorWrapper>
                          {(conditionsQuery.data ?? []).map((condition) => (
                            <SelectItem
                              key={condition.id}
                              label={condition.name}
                              value={condition.id}
                            />
                          ))}
                        </SelectContent>
                      </SelectPortal>
                    </Select>
                  )}
                  {(conditionsQuery.data ?? []).length === 0 &&
                  !conditionsQuery.isLoading ? (
                    <Text className="text-xs text-muted-foreground">
                      El paciente no tiene diagnósticos. Agrega uno antes de
                      agendar sesión.
                    </Text>
                  ) : null}
                  {errors.conditionId ? (
                    <FormControlError>
                      <FormControlErrorText>
                        {errors.conditionId.message}
                      </FormControlErrorText>
                    </FormControlError>
                  ) : null}
                </FormControl>
              )}
            />
          ) : null}

          <Controller
            control={control}
            name="date"
            render={({ field: { value, onChange } }) => (
              <FormControl isInvalid={Boolean(errors.date)}>
                <FormControlLabel>
                  <FormControlLabelText>Fecha *</FormControlLabelText>
                </FormControlLabel>
                <Button
                  variant="outline"
                  onPress={() => setShowDatePicker(true)}
                >
                  <ButtonText>{dayjs(value).format("DD/MM/YYYY")}</ButtonText>
                </Button>
                {showDatePicker ? (
                  <DateTimePicker
                    value={dayjs(value).toDate()}
                    mode="date"
                    minimumDate={
                      // this date is set to 1 year in the past just in case the user wants to backdate the session
                      dayjs().subtract(1, "year").toDate()
                    }
                    maximumDate={dayjs().add(5, "year").toDate()}
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(_, date) => {
                      if (Platform.OS === "android") {
                        setShowDatePicker(false);
                      }
                      if (date) {
                        onChange(dayjs(date).format("YYYY-MM-DD"));
                      }
                    }}
                  />
                ) : null}
                {errors.date ? (
                  <FormControlError>
                    <FormControlErrorText>
                      {errors.date.message}
                    </FormControlErrorText>
                  </FormControlError>
                ) : null}
              </FormControl>
            )}
          />

          <Controller
            control={control}
            name="notes"
            render={({ field: { value, onChange } }) => (
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText>Notas</FormControlLabelText>
                </FormControlLabel>
                <Textarea className="bg-card">
                  <TextareaInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="Notas clínicas de la sesión"
                  />
                </Textarea>
              </FormControl>
            )}
          />

          <VStack space="sm">
            <Text className="text-sm font-semibold text-foreground">
              Procedimientos aplicados
            </Text>

            <Input className="bg-card">
              <InputField
                value={procedureSearch}
                onChangeText={setProcedureSearch}
                placeholder="Buscar procedimientos"
              />
            </Input>

            {proceduresQuery.isLoading ? (
              <Spinner />
            ) : (
              <CheckboxGroup
                value={selectedProcedureIds}
                onChange={(values) => setSelectedProcedureIds(values)}
              >
                <VStack space="sm">
                  {(proceduresQuery.data ?? [])
                    .slice(0, 12)
                    .map((procedure) => {
                      return (
                        <Checkbox
                          key={procedure.id}
                          value={procedure.id}
                          className="rounded-md border border-border bg-card px-3 py-2"
                        >
                          <CheckboxIndicator />
                          <CheckboxLabel>{procedure.name}</CheckboxLabel>
                        </Checkbox>
                      );
                    })}
                </VStack>
              </CheckboxGroup>
            )}

            {selectedProcedureIds.length > 0 ? (
              <VStack space="sm">
                <Text className="text-xs text-muted-foreground">
                  Seleccionados: {selectedProcedureIds.length}
                </Text>

                <Text className="text-xs font-semibold uppercase text-muted-foreground">
                  Detalle por procedimiento (acordeon)
                </Text>

                {selectedProcedures.map((procedure) => {
                  const isExpanded = expandedProcedureId === procedure.id;
                  const draft = procedureDrafts[procedure.id] ?? {
                    sets: "",
                    reps: "",
                    durationSec: "",
                    instructions: "",
                  };

                  return (
                    <Box
                      key={procedure.id}
                      className="rounded-lg border border-border bg-card p-3"
                    >
                      <VStack space="sm">
                        <Button
                          variant="outline"
                          onPress={() =>
                            setExpandedProcedureId((prev) =>
                              prev === procedure.id ? null : procedure.id,
                            )
                          }
                          className="w-full items-start"
                        >
                          <VStack space="xs" className="w-full">
                            <ButtonText>{procedure.name}</ButtonText>
                            <Text className="text-xs text-muted-foreground">
                              {draft.sets || draft.reps || draft.durationSec
                                ? `Sets ${draft.sets || "-"} · Reps ${draft.reps || "-"} · Duracion ${draft.durationSec || "-"}s`
                                : "Sin detalle cargado"}
                            </Text>
                          </VStack>
                        </Button>

                        {isExpanded ? (
                          <VStack space="sm">
                            <HStack space="sm">
                              <FormControl className="flex-1">
                                <FormControlLabel>
                                  <FormControlLabelText>
                                    Sets
                                  </FormControlLabelText>
                                </FormControlLabel>
                                <Input className="bg-background">
                                  <InputField
                                    value={draft.sets}
                                    onChangeText={(value) =>
                                      updateProcedureDraft(
                                        procedure.id,
                                        "sets",
                                        value,
                                      )
                                    }
                                    keyboardType="numeric"
                                    placeholder="Ej: 3"
                                  />
                                </Input>
                              </FormControl>

                              <FormControl className="flex-1">
                                <FormControlLabel>
                                  <FormControlLabelText>
                                    Reps
                                  </FormControlLabelText>
                                </FormControlLabel>
                                <Input className="bg-background">
                                  <InputField
                                    value={draft.reps}
                                    onChangeText={(value) =>
                                      updateProcedureDraft(
                                        procedure.id,
                                        "reps",
                                        value,
                                      )
                                    }
                                    keyboardType="numeric"
                                    placeholder="Ej: 12"
                                  />
                                </Input>
                              </FormControl>

                              <FormControl className="flex-1">
                                <FormControlLabel>
                                  <FormControlLabelText>
                                    Duracion (seg)
                                  </FormControlLabelText>
                                </FormControlLabel>
                                <Input className="bg-background">
                                  <InputField
                                    value={draft.durationSec}
                                    onChangeText={(value) =>
                                      updateProcedureDraft(
                                        procedure.id,
                                        "durationSec",
                                        value,
                                      )
                                    }
                                    keyboardType="numeric"
                                    placeholder="Ej: 45"
                                  />
                                </Input>
                              </FormControl>
                            </HStack>

                            <FormControl>
                              <FormControlLabel>
                                <FormControlLabelText>
                                  Nota del procedimiento
                                </FormControlLabelText>
                              </FormControlLabel>
                              <Textarea className="bg-background">
                                <TextareaInput
                                  value={draft.instructions}
                                  onChangeText={(value) =>
                                    updateProcedureDraft(
                                      procedure.id,
                                      "instructions",
                                      value,
                                    )
                                  }
                                  placeholder="Instrucciones y observaciones"
                                />
                              </Textarea>
                            </FormControl>
                          </VStack>
                        ) : null}
                      </VStack>
                    </Box>
                  );
                })}
              </VStack>
            ) : null}
          </VStack>

          <Box className="rounded-xl border border-border bg-card p-4">
            <Text className="text-sm text-muted-foreground">
              Estado inicial de la sesión:{" "}
              <Text className="font-semibold">agendada</Text>
            </Text>
            {selectedPatient ? (
              <Text className="mt-1 text-xs text-muted-foreground">
                Paciente: {selectedPatient.name} · Fecha:{" "}
                {dayjs(selectedDate).format("DD/MM/YYYY")}
              </Text>
            ) : null}
          </Box>

          {submitError ? (
            <Text className="text-sm text-destructive">{submitError}</Text>
          ) : null}

          <HStack space="sm">
            <Button
              className="flex-1"
              variant="outline"
              onPress={() => router.back()}
              disabled={createSessionMutation.isPending}
            >
              <ButtonText>Cancelar</ButtonText>
            </Button>
            <Button
              className="flex-1"
              onPress={onSubmit}
              disabled={
                createSessionMutation.isPending ||
                !selectedPatientId ||
                !selectedConditionId
              }
            >
              {createSessionMutation.isPending ? (
                <Spinner size="small" />
              ) : (
                <ButtonText>Agendar sesión</ButtonText>
              )}
            </Button>
          </HStack>
        </VStack>
      </ScrollView>
    </Box>
  );
}
