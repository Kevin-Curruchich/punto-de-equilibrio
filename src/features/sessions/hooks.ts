import {
  createScheduledSession,
  listPatientSessions,
  updateSessionStatus,
  type CreateScheduledSessionInput,
  type UpdateSessionStatusInput,
} from "@/src/services/firebase/sessions";
import type { UUID } from "@/src/types/domain";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function usePatientSessions(
  physiotherapistId: UUID | null,
  patientId: UUID | null,
) {
  return useQuery({
    queryKey: ["patient-sessions", physiotherapistId, patientId],
    queryFn: () => {
      if (!physiotherapistId || !patientId) {
        throw new Error("No hay paciente para listar sesiones.");
      }

      return listPatientSessions(physiotherapistId, patientId);
    },
    enabled: Boolean(physiotherapistId && patientId),
  });
}

export function useCreateScheduledSession(physiotherapistId: UUID | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      input: Omit<CreateScheduledSessionInput, "physiotherapistId">,
    ) => {
      if (!physiotherapistId) {
        throw new Error("No hay fisioterapeuta autenticado.");
      }

      return createScheduledSession({
        ...input,
        physiotherapistId,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["patient-sessions", physiotherapistId, variables.patientId],
      });
    },
  });
}

export function useUpdateSessionStatus(
  physiotherapistId: UUID | null,
  patientId: UUID | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      input: Omit<UpdateSessionStatusInput, "physiotherapistId">,
    ) => {
      if (!physiotherapistId) {
        throw new Error("No hay fisioterapeuta autenticado.");
      }

      return updateSessionStatus({
        ...input,
        physiotherapistId,
      });
    },
    onSuccess: () => {
      if (patientId) {
        queryClient.invalidateQueries({
          queryKey: ["patient-sessions", physiotherapistId, patientId],
        });
      }
    },
  });
}
