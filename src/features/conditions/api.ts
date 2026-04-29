import {
  createCondition,
  deleteConditionIfEmpty,
  getConditionById,
  getConditionMeasurements,
  getPatientConditions,
  updateCondition,
  type CreateConditionInput,
  type UpdateConditionInput,
} from "@/src/services/firebase/conditions";
import {
  createMetric,
  createMetrics,
  deleteMetric,
  getConditionMetrics,
  updateMetric,
  type CreateMetricInput,
  type UpdateMetricInput,
} from "@/src/services/firebase/metrics";
import type { UUID } from "@/src/types/domain";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Hook para obtener todos los diagnósticos de un paciente
 */
export function usePatientConditions(patientId: UUID | null) {
  return useQuery({
    queryKey: ["patient-conditions", patientId],
    queryFn: () => getPatientConditions(patientId as UUID),
    enabled: Boolean(patientId),
  });
}

/**
 * Hook para obtener un diagnóstico por ID
 */
export function useConditionById(conditionId: UUID | null) {
  return useQuery({
    queryKey: ["condition", conditionId],
    queryFn: () => getConditionById(conditionId as UUID),
    enabled: Boolean(conditionId),
  });
}

/**
 * Hook para crear un nuevo diagnóstico
 */
export function useCreateCondition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateConditionInput) => createCondition(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["patient-conditions", variables.patientId],
      });
    },
  });
}

/**
 * Hook para actualizar un diagnóstico existente
 */
export function useUpdateCondition(patientId: UUID | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateConditionInput) => updateCondition(input),
    onSuccess: (_, variables) => {
      if (patientId) {
        queryClient.invalidateQueries({
          queryKey: ["patient-conditions", patientId],
        });
      }

      queryClient.invalidateQueries({
        queryKey: ["condition", variables.conditionId],
      });
    },
  });
}

/**
 * Hook para eliminar un diagnóstico solo si no tiene relaciones
 */
export function useDeleteCondition(patientId: UUID | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conditionId }: { conditionId: UUID }) =>
      deleteConditionIfEmpty({
        conditionId,
        patientId: patientId ?? undefined,
      }),
    onSuccess: () => {
      if (patientId) {
        queryClient.invalidateQueries({
          queryKey: ["patient-conditions", patientId],
        });
      }
    },
  });
}

/**
 * Hook para obtener todos los registros de medición de una condición
 */
export function useConditionMeasurements(conditionId: UUID | null) {
  return useQuery({
    queryKey: ["condition-measurements", conditionId],
    queryFn: () => getConditionMeasurements(conditionId as UUID),
    enabled: Boolean(conditionId),
  });
}

// ============================================================
// METRICS HOOKS
// ============================================================

/**
 * Hook para obtener todas las métricas de una condición
 */
export function useConditionMetrics(conditionId: UUID | null) {
  return useQuery({
    queryKey: ["condition-metrics", conditionId],
    queryFn: () => getConditionMetrics(conditionId as UUID),
    enabled: Boolean(conditionId),
  });
}

/**
 * Hook para crear una nueva métrica
 */
export function useCreateMetric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMetricInput) => createMetric(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["condition-metrics", variables.conditionId],
      });
    },
  });
}

/**
 * Hook para crear múltiples métricas
 */
export function useCreateMetrics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inputs: CreateMetricInput[]) => createMetrics(inputs),
    onSuccess: (_, variables) => {
      // Invalidate metrics for all affected conditions
      const conditionIds = new Set(variables.map((input) => input.conditionId));
      conditionIds.forEach((conditionId) => {
        queryClient.invalidateQueries({
          queryKey: ["condition-metrics", conditionId],
        });
      });
    },
  });
}

/**
 * Hook para actualizar una métrica
 */
export function useUpdateMetric(conditionId: UUID | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMetricInput) => updateMetric(input),
    onSuccess: () => {
      if (conditionId) {
        queryClient.invalidateQueries({
          queryKey: ["condition-metrics", conditionId],
        });
      }
    },
  });
}

/**
 * Hook para eliminar una métrica
 */
export function useDeleteMetric(conditionId: UUID | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ metricId }: { metricId: UUID }) => deleteMetric(metricId),
    onSuccess: () => {
      if (conditionId) {
        queryClient.invalidateQueries({
          queryKey: ["condition-metrics", conditionId],
        });
      }
    },
  });
}
