import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPatientForPhysio,
  getPhysioPatientById,
  listPhysioPatients,
  updatePatientForPhysio,
  type CreatePatientInput,
  type UpdatePatientInput,
} from "./api";

export function usePhysioPatients(physiotherapistId: string | null) {
  return useQuery({
    queryKey: ["physio-patients", physiotherapistId],
    queryFn: () => listPhysioPatients(physiotherapistId as string),
    enabled: Boolean(physiotherapistId),
  });
}

export function useCreatePatient(physiotherapistId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<CreatePatientInput, "physiotherapistId">) => {
      if (!physiotherapistId) {
        throw new Error("No hay fisioterapeuta autenticado.");
      }

      return createPatientForPhysio({
        ...input,
        physiotherapistId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["physio-patients", physiotherapistId],
      });
    },
  });
}

export function usePhysioPatient(
  physiotherapistId: string | null,
  patientId: string | null,
) {
  return useQuery({
    queryKey: ["physio-patient", physiotherapistId, patientId],
    queryFn: () =>
      getPhysioPatientById(physiotherapistId as string, patientId as string),
    enabled: Boolean(physiotherapistId && patientId),
  });
}

export function useUpdatePatient(physiotherapistId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<UpdatePatientInput, "physiotherapistId">) => {
      if (!physiotherapistId) {
        throw new Error("No hay fisioterapeuta autenticado.");
      }

      return updatePatientForPhysio({
        ...input,
        physiotherapistId,
      });
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["physio-patients", physiotherapistId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["physio-patient", physiotherapistId, variables.patientId],
        }),
      ]);
    },
  });
}
