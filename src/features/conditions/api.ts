import {
  createCondition,
  deleteConditionIfEmpty,
  getConditionById,
  getPatientConditions,
  updateCondition,
  type CreateConditionInput,
  type UpdateConditionInput,
} from "@/src/services/firebase/conditions";
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
