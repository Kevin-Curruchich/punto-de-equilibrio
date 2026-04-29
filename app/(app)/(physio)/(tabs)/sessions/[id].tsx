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
import { ConditionMetricsDisplay } from "@/src/features/conditions/condition-metrics-display";
import { useAvailableProcedures } from "@/src/features/procedures/hooks";
import {
  usePatientSessionDetail,
  useUpdateSession,
} from "@/src/features/sessions/hooks";
import { useAuthStore } from "@/src/store/auth";
import type { SessionStatus } from "@/src/types/domain";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SessionProcedureDraft = {
  sets: string;
  reps: string;
  durationSec: string;
  instructions: string;
};

type MeasurementDraft = {
  metricName: string;
  unit: string;
  value: string;
  notes: string;
};

const SESSION_STATUS_OPTIONS: { label: string; value: SessionStatus }[] = [
  { label: "Agendada", value: "scheduled" },
  { label: "Completada", value: "completed" },
  { label: "Cancelada", value: "cancelled" },
];

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const safeArea = useSafeAreaInsets();

  const user = useAuthStore((state) => state.user);
  const physiotherapistId = user?.id ?? null;
  const resolvedSessionId = typeof id === "string" ? id : null;

  const sessionQuery = usePatientSessionDetail(
    physiotherapistId,
    resolvedSessionId,
  );
  const session = sessionQuery.data;
  const patientId = session?.patientId ?? null;

  const conditionsQuery = usePatientConditions(patientId);
  const proceduresQuery = useAvailableProcedures(physiotherapistId, "");
  const updateSessionMutation = useUpdateSession(
    physiotherapistId,
    patientId,
    resolvedSessionId,
  );

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [procedureSearch, setProcedureSearch] = useState("");
  const [selectedConditionId, setSelectedConditionId] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD"),
  );
  const [durationMin, setDurationMin] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedStatus, setSelectedStatus] =
    useState<SessionStatus>("scheduled");
  const [selectedProcedureIds, setSelectedProcedureIds] = useState<string[]>(
    [],
  );
  const [expandedProcedureId, setExpandedProcedureId] = useState<string | null>(
    null,
  );
  const [procedureDrafts, setProcedureDrafts] = useState<
    Record<string, SessionProcedureDraft>
  >({});
  const [measurementDrafts, setMeasurementDrafts] = useState<
    MeasurementDraft[]
  >([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [initializedSessionId, setInitializedSessionId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!session || initializedSessionId === session.id) {
      return;
    }

    setSelectedConditionId(session.conditionId);
    setSelectedDate(session.date);
    setDurationMin(session.durationMin ? String(session.durationMin) : "");
    setNotes(session.notes ?? "");
    setSelectedStatus(session.status);

    const sessionProcedureRows = session.sessionProcedures ?? [];
    const nextProcedureIds = Array.from(
      new Set([
        ...(session.procedureIds ?? []),
        ...sessionProcedureRows.map((item) => item.procedureId),
      ]),
    );

    setSelectedProcedureIds(nextProcedureIds);
    setProcedureDrafts(
      sessionProcedureRows.reduce<Record<string, SessionProcedureDraft>>(
        (accumulator, item) => {
          accumulator[item.procedureId] = {
            sets: item.sets ? String(item.sets) : "",
            reps: item.reps ? String(item.reps) : "",
            durationSec: item.durationSec ? String(item.durationSec) : "",
            instructions: item.instructions ?? "",
          };
          return accumulator;
        },
        {},
      ),
    );
    setMeasurementDrafts(
      (session.measurements ?? []).map((item) => ({
        metricName: item.metricName,
        unit: item.unit ?? "",
        value: String(item.value),
        notes: item.notes ?? "",
      })),
    );
    setInitializedSessionId(session.id);
  }, [initializedSessionId, session]);

  useEffect(() => {
    setProcedureDrafts((previous) => {
      const next: Record<string, SessionProcedureDraft> = {};

      selectedProcedureIds.forEach((procedureId) => {
        next[procedureId] = previous[procedureId] ?? {
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
  }, [expandedProcedureId, selectedProcedureIds]);

  const filteredProcedures = useMemo(() => {
    const term = procedureSearch.trim().toLowerCase();
    const procedures = proceduresQuery.data ?? [];

    if (!term) {
      return procedures;
    }

    return procedures.filter((item) =>
      [item.name, item.category ?? "", item.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [procedureSearch, proceduresQuery.data]);

  const selectedProcedures = useMemo(() => {
    const byId = new Map(
      (proceduresQuery.data ?? []).map((item) => [item.id, item]),
    );

    return selectedProcedureIds.map((id) => ({
      id,
      procedure: byId.get(id) ?? null,
      draft: procedureDrafts[id] ?? {
        sets: "",
        reps: "",
        durationSec: "",
        instructions: "",
      },
    }));
  }, [procedureDrafts, proceduresQuery.data, selectedProcedureIds]);

  const updateProcedureDraft = (
    procedureId: string,
    field: keyof SessionProcedureDraft,
    value: string,
  ) => {
    setProcedureDrafts((previous) => ({
      ...previous,
      [procedureId]: {
        ...(previous[procedureId] ?? {
          sets: "",
          reps: "",
          durationSec: "",
          instructions: "",
        }),
        [field]: value,
      },
    }));
  };

  const addMeasurementDraft = () => {
    setMeasurementDrafts((previous) => [
      ...previous,
      { metricName: "", unit: "", value: "", notes: "" },
    ]);
  };

  const updateMeasurementDraft = (
    index: number,
    field: keyof MeasurementDraft,
    value: string,
  ) => {
    setMeasurementDrafts((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const removeMeasurementDraft = (index: number) => {
    setMeasurementDrafts((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const saveSession = async (nextStatus: SessionStatus) => {
    if (!session) {
      return;
    }

    setSubmitError(null);

    if (!selectedConditionId) {
      throw new Error("Selecciona un diagnóstico.");
    }

    if (!selectedDate) {
      throw new Error("Selecciona una fecha para la sesión.");
    }

    if (durationMin.trim() && Number.isNaN(Number(durationMin))) {
      throw new Error("La duración debe ser un número válido.");
    }

    const measurements = measurementDrafts.reduce<
      {
        metricName: string;
        unit?: string;
        value: number;
        notes?: string;
      }[]
    >((accumulator, item, index) => {
      const metricName = item.metricName.trim();
      const unit = item.unit.trim();
      const valueText = item.value.trim();
      const notesValue = item.notes.trim();
      const isEmptyRow = !metricName && !unit && !valueText && !notesValue;

      if (isEmptyRow) {
        return accumulator;
      }

      if (!metricName) {
        throw new Error(
          `La medición #${index + 1} necesita un nombre de métrica.`,
        );
      }

      if (!valueText || Number.isNaN(Number(valueText))) {
        throw new Error(
          `La medición #${index + 1} necesita un valor numérico válido.`,
        );
      }

      accumulator.push({
        metricName,
        unit: unit || undefined,
        value: Number(valueText),
        notes: notesValue || undefined,
      });
      return accumulator;
    }, []);

    const sessionProcedures = selectedProcedureIds.map((procedureId) => {
      const draft = procedureDrafts[procedureId];

      if (draft?.sets.trim() && Number.isNaN(Number(draft.sets.trim()))) {
        throw new Error("Los sets deben ser un número válido.");
      }

      if (draft?.reps.trim() && Number.isNaN(Number(draft.reps.trim()))) {
        throw new Error("Las repeticiones deben ser un número válido.");
      }

      if (
        draft?.durationSec.trim() &&
        Number.isNaN(Number(draft.durationSec.trim()))
      ) {
        throw new Error(
          "La duración del procedimiento debe ser un número válido.",
        );
      }

      return {
        procedureId,
        sets: draft?.sets.trim() ? Number(draft.sets) : undefined,
        reps: draft?.reps.trim() ? Number(draft.reps) : undefined,
        durationSec: draft?.durationSec.trim()
          ? Number(draft.durationSec)
          : undefined,
        instructions: draft?.instructions.trim() || undefined,
      };
    });

    await updateSessionMutation.mutateAsync({
      sessionId: session.id,
      conditionId: selectedConditionId,
      date: selectedDate,
      durationMin: durationMin.trim() ? Number(durationMin) : undefined,
      notes,
      status: nextStatus,
      procedureIds: selectedProcedureIds,
      sessionProcedures,
      measurements,
    });
  };

  const handleSave = async () => {
    try {
      await saveSession(selectedStatus);

      Alert.alert(
        "Sesión actualizada",
        "Los cambios se guardaron correctamente.",
      );
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la sesión.",
      );
    }
  };

  const handleChangeStatus = async (
    nextStatus: Extract<SessionStatus, "completed" | "cancelled">,
  ) => {
    try {
      setSelectedStatus(nextStatus);
      await saveSession(nextStatus);
      Alert.alert(
        "Sesión actualizada",
        "El estado se actualizó correctamente.",
      );
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el estado de la sesión.",
      );
    }
  };

  if (!resolvedSessionId) {
    return (
      <Box className="flex-1 items-center justify-center bg-background px-6">
        <VStack space="md" className="items-center">
          <Text className="text-destructive">Falta la sesión a consultar.</Text>
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

  if (sessionQuery.isLoading) {
    return (
      <Box className="flex-1 items-center justify-center bg-background px-6">
        <VStack space="sm" className="items-center">
          <Spinner />
          <Text className="text-muted-foreground">Cargando sesión...</Text>
        </VStack>
      </Box>
    );
  }

  if (sessionQuery.isError || !session) {
    return (
      <Box className="flex-1 items-center justify-center bg-background px-6">
        <VStack space="md" className="items-center">
          <Text className="text-destructive">
            No se pudo cargar la sesión solicitada.
          </Text>
          <Button variant="outline" onPress={() => router.back()}>
            <ButtonText>Volver</ButtonText>
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: `Sesión ${dayjs(session.date).format("DD/MM/YYYY")}`,
        }}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <VStack space="lg">
          <Box className="rounded-xl border border-border bg-card p-4">
            <VStack space="xs">
              <Text className="text-lg font-semibold text-foreground">
                {session.conditionName}
              </Text>
              <Text className="text-sm text-muted-foreground">
                Fecha registrada: {dayjs(session.date).format("DD/MM/YYYY")}
              </Text>
              <Text className="text-xs text-muted-foreground">
                Creada: {dayjs(session.createdAt).format("DD/MM/YYYY HH:mm")}
              </Text>
            </VStack>
          </Box>

          <VStack space="md">
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Diagnóstico</FormControlLabelText>
              </FormControlLabel>
              {conditionsQuery.isLoading ? (
                <Spinner />
              ) : (
                <Select
                  selectedValue={selectedConditionId}
                  onValueChange={setSelectedConditionId}
                >
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
            </FormControl>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Estado</FormControlLabelText>
              </FormControlLabel>
              <Select
                selectedValue={selectedStatus}
                onValueChange={(value) =>
                  setSelectedStatus(value as SessionStatus)
                }
              >
                <SelectTrigger variant="outline" size="md">
                  <SelectInput placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    {SESSION_STATUS_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        label={option.label}
                        value={option.value}
                      />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
            </FormControl>

            <VStack space="sm">
              <Text className="text-xs text-muted-foreground">
                Cambiar estado rápido
              </Text>
              <HStack space="sm">
                <Button
                  onPress={() => handleChangeStatus("completed")}
                  disabled={
                    updateSessionMutation.isPending ||
                    selectedStatus === "completed"
                  }
                  className="flex-1"
                >
                  <ButtonText>Marcar completada</ButtonText>
                </Button>
                <Button
                  variant="outline"
                  onPress={() => handleChangeStatus("cancelled")}
                  disabled={
                    updateSessionMutation.isPending ||
                    selectedStatus === "cancelled"
                  }
                  className="flex-1"
                >
                  <ButtonText>Cancelar sesión</ButtonText>
                </Button>
              </HStack>
            </VStack>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Fecha</FormControlLabelText>
              </FormControlLabel>
              <Button variant="outline" onPress={() => setShowDatePicker(true)}>
                <ButtonText>
                  {dayjs(selectedDate).format("DD/MM/YYYY")}
                </ButtonText>
              </Button>
              {showDatePicker ? (
                <DateTimePicker
                  value={dayjs(selectedDate).toDate()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_, nextDate) => {
                    if (Platform.OS === "android") {
                      setShowDatePicker(false);
                    }

                    if (nextDate) {
                      setSelectedDate(dayjs(nextDate).format("YYYY-MM-DD"));
                    }
                  }}
                />
              ) : null}
            </FormControl>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Duración (min)</FormControlLabelText>
              </FormControlLabel>
              <Input className="bg-card">
                <InputField
                  value={durationMin}
                  onChangeText={setDurationMin}
                  keyboardType="numeric"
                  placeholder="Ej: 45"
                />
              </Input>
            </FormControl>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Notas clínicas</FormControlLabelText>
              </FormControlLabel>
              <Textarea className="bg-card">
                <TextareaInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Observaciones de la sesión"
                />
              </Textarea>
            </FormControl>
          </VStack>

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
                  {filteredProcedures.slice(0, 20).map((procedure) => (
                    <Checkbox
                      key={procedure.id}
                      value={procedure.id}
                      className="rounded-md border border-border bg-card px-3 py-2"
                    >
                      <CheckboxIndicator />
                      <CheckboxLabel>{procedure.name}</CheckboxLabel>
                    </Checkbox>
                  ))}
                </VStack>
              </CheckboxGroup>
            )}

            {selectedProcedures.length > 0 ? (
              <VStack space="sm">
                {selectedProcedures.map(({ id, procedure, draft }) => {
                  const isExpanded = expandedProcedureId === id;

                  return (
                    <Box
                      key={id}
                      className="rounded-lg border border-border bg-card p-3"
                    >
                      <VStack space="sm">
                        <Button
                          variant="outline"
                          onPress={() =>
                            setExpandedProcedureId((previous) =>
                              previous === id ? null : id,
                            )
                          }
                          className="w-full items-start"
                        >
                          <VStack space="xs" className="w-full">
                            <ButtonText>
                              {procedure?.name ?? `Procedimiento ${id}`}
                            </ButtonText>
                            <Text className="text-xs text-muted-foreground">
                              {draft.sets || draft.reps || draft.durationSec
                                ? `Sets ${draft.sets || "-"} · Reps ${draft.reps || "-"} · Duración ${draft.durationSec || "-"}s`
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
                                      updateProcedureDraft(id, "sets", value)
                                    }
                                    keyboardType="numeric"
                                    placeholder="3"
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
                                      updateProcedureDraft(id, "reps", value)
                                    }
                                    keyboardType="numeric"
                                    placeholder="12"
                                  />
                                </Input>
                              </FormControl>

                              <FormControl className="flex-1">
                                <FormControlLabel>
                                  <FormControlLabelText>
                                    Duración (seg)
                                  </FormControlLabelText>
                                </FormControlLabel>
                                <Input className="bg-background">
                                  <InputField
                                    value={draft.durationSec}
                                    onChangeText={(value) =>
                                      updateProcedureDraft(
                                        id,
                                        "durationSec",
                                        value,
                                      )
                                    }
                                    keyboardType="numeric"
                                    placeholder="45"
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
                                      id,
                                      "instructions",
                                      value,
                                    )
                                  }
                                  placeholder="Instrucciones u observaciones"
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

          <VStack space="sm">
            <HStack className="items-center justify-between">
              <Text className="text-sm font-semibold text-foreground">
                Mediciones
              </Text>
              <Button variant="outline" onPress={addMeasurementDraft}>
                <ButtonText>+ Agregar medición</ButtonText>
              </Button>
            </HStack>

            {selectedConditionId && (
              <ConditionMetricsDisplay
                conditionId={selectedConditionId}
                onSelectMetric={(metric) => {
                  // Autofill a measurement row with the metric name and unit
                  const lastEmpty = measurementDrafts.findIndex(
                    (m) => m.metricName.trim().length === 0,
                  );

                  if (lastEmpty !== -1) {
                    updateMeasurementDraft(
                      lastEmpty,
                      "metricName",
                      metric.name,
                    );
                    updateMeasurementDraft(lastEmpty, "unit", metric.unit);
                  } else {
                    // Add a new measurement draft with the metric
                    setMeasurementDrafts((prev) => [
                      ...prev,
                      {
                        metricName: metric.name,
                        unit: metric.unit,
                        value: "",
                        notes: "",
                      },
                    ]);
                  }
                }}
              />
            )}

            {measurementDrafts.length === 0 ? (
              <Box className="rounded-lg border border-border bg-card p-4">
                <Text className="text-xs text-muted-foreground">
                  Esta sesión no tiene mediciones registradas.
                </Text>
              </Box>
            ) : (
              <VStack space="sm">
                {measurementDrafts.map((item, index) => (
                  <Box
                    key={`measurement-${index}`}
                    className="rounded-lg border border-border bg-card p-3"
                  >
                    <VStack space="sm">
                      <HStack className="items-center justify-between">
                        <Text className="text-xs font-semibold uppercase text-muted-foreground">
                          Medición #{index + 1}
                        </Text>
                        <Button
                          variant="outline"
                          onPress={() => removeMeasurementDraft(index)}
                        >
                          <ButtonText>Eliminar</ButtonText>
                        </Button>
                      </HStack>

                      <FormControl>
                        <FormControlLabel>
                          <FormControlLabelText>Métrica</FormControlLabelText>
                        </FormControlLabel>
                        <Input className="bg-background">
                          <InputField
                            value={item.metricName}
                            onChangeText={(value) =>
                              updateMeasurementDraft(index, "metricName", value)
                            }
                            placeholder="Ej: Dolor EVA"
                          />
                        </Input>
                      </FormControl>

                      <HStack space="sm">
                        <FormControl className="flex-1">
                          <FormControlLabel>
                            <FormControlLabelText>Valor</FormControlLabelText>
                          </FormControlLabel>
                          <Input className="bg-background">
                            <InputField
                              value={item.value}
                              onChangeText={(value) =>
                                updateMeasurementDraft(index, "value", value)
                              }
                              keyboardType="numeric"
                              placeholder="Ej: 6"
                            />
                          </Input>
                        </FormControl>

                        <FormControl className="flex-1">
                          <FormControlLabel>
                            <FormControlLabelText>Unidad</FormControlLabelText>
                          </FormControlLabel>
                          <Input className="bg-background">
                            <InputField
                              value={item.unit}
                              onChangeText={(value) =>
                                updateMeasurementDraft(index, "unit", value)
                              }
                              placeholder="Ej: /10"
                            />
                          </Input>
                        </FormControl>
                      </HStack>

                      <FormControl>
                        <FormControlLabel>
                          <FormControlLabelText>Notas</FormControlLabelText>
                        </FormControlLabel>
                        <Textarea className="bg-background">
                          <TextareaInput
                            value={item.notes}
                            onChangeText={(value) =>
                              updateMeasurementDraft(index, "notes", value)
                            }
                            placeholder="Contexto de la medición"
                          />
                        </Textarea>
                      </FormControl>
                    </VStack>
                  </Box>
                ))}
              </VStack>
            )}
          </VStack>

          {submitError ? (
            <Text className="text-sm text-destructive">{submitError}</Text>
          ) : null}

          <HStack space="sm">
            <Button
              onPress={handleSave}
              disabled={updateSessionMutation.isPending}
              className="flex-1"
            >
              {updateSessionMutation.isPending ? (
                <Spinner size="small" />
              ) : null}
              <ButtonText>Guardar cambios</ButtonText>
            </Button>
            <Button
              variant="outline"
              onPress={() => router.back()}
              className="flex-1"
            >
              <ButtonText>Volver</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </ScrollView>
    </View>
  );
}
