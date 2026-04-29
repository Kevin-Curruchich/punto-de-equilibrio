import {
  createScheduledSession,
  getPatientSessionDetail,
  listPatientSessions,
  listPhysioSessions,
  updateSession,
  updateSessionStatus,
  type CreateScheduledSessionInput,
  type UpdateSessionStatusInput,
} from "@/src/services/firebase/sessions";
import type { UpdateSessionInput, UUID } from "@/src/types/domain";
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

export function usePhysioSessions(physiotherapistId: UUID | null) {
  return useQuery({
    queryKey: ["physio-sessions", physiotherapistId],
    queryFn: () => {
      if (!physiotherapistId) {
        throw new Error("No hay fisioterapeuta autenticado.");
      }

      return listPhysioSessions(physiotherapistId);
    },
    enabled: Boolean(physiotherapistId),
  });
}

export function usePatientSessionDetail(
  physiotherapistId: UUID | null,
  sessionId: UUID | null,
) {
  return useQuery({
    queryKey: ["patient-session", physiotherapistId, sessionId],
    queryFn: () => {
      if (!physiotherapistId || !sessionId) {
        throw new Error("No hay sesión para consultar.");
      }

      return getPatientSessionDetail(physiotherapistId, sessionId);
    },
    enabled: Boolean(physiotherapistId && sessionId),
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
      queryClient.invalidateQueries({
        queryKey: ["physio-sessions", physiotherapistId],
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

      queryClient.invalidateQueries({
        queryKey: ["physio-sessions", physiotherapistId],
      });
    },
  });
}

export function useUpdateSession(
  physiotherapistId: UUID | null,
  patientId: UUID | null,
  sessionId: UUID | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<UpdateSessionInput, "physiotherapistId">) => {
      if (!physiotherapistId) {
        throw new Error("No hay fisioterapeuta autenticado.");
      }

      return updateSession({
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

      if (sessionId) {
        queryClient.invalidateQueries({
          queryKey: ["patient-session", physiotherapistId, sessionId],
        });
      }

      queryClient.invalidateQueries({
        queryKey: ["physio-sessions", physiotherapistId],
      });
    },
  });
}
