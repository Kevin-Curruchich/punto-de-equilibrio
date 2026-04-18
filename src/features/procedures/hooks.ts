import {
  createProcedure,
  getOwnEditableProcedureById,
  listAvailableProcedures,
  searchAvailableProcedures,
  seedPublicProcedureCatalog,
  updateOwnProcedure,
  type CreateProcedureInput,
  type UpdateProcedureInput,
} from "@/src/services/firebase/procedures";
import type { UUID } from "@/src/types/domain";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useAvailableProcedures(
  physiotherapistId: UUID | null,
  searchTerm: string,
) {
  return useQuery({
    queryKey: ["available-procedures", physiotherapistId, searchTerm],
    queryFn: () => {
      if (!physiotherapistId) {
        throw new Error("No hay fisioterapeuta autenticado.");
      }

      const term = searchTerm.trim();
      if (!term) {
        return listAvailableProcedures(physiotherapistId);
      }

      return searchAvailableProcedures(physiotherapistId, term);
    },
    enabled: Boolean(physiotherapistId),
  });
}

export function useCreateProcedure(physiotherapistId: UUID | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<CreateProcedureInput, "physiotherapistId">) => {
      if (!physiotherapistId) {
        throw new Error("No hay fisioterapeuta autenticado.");
      }

      return createProcedure({
        ...input,
        physiotherapistId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["available-procedures"] });
    },
  });
}

export function useSeedPublicProcedures() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => seedPublicProcedureCatalog(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["available-procedures"] });
    },
  });
}

export function useOwnEditableProcedure(
  physiotherapistId: UUID | null,
  procedureId: UUID | null,
) {
  return useQuery({
    queryKey: ["own-editable-procedure", physiotherapistId, procedureId],
    queryFn: () => {
      if (!physiotherapistId || !procedureId) {
        throw new Error("No hay procedimiento para editar.");
      }

      return getOwnEditableProcedureById(physiotherapistId, procedureId);
    },
    enabled: Boolean(physiotherapistId && procedureId),
  });
}

export function useUpdateOwnProcedure(physiotherapistId: UUID | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<UpdateProcedureInput, "physiotherapistId">) => {
      if (!physiotherapistId) {
        throw new Error("No hay fisioterapeuta autenticado.");
      }

      return updateOwnProcedure({
        ...input,
        physiotherapistId,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["available-procedures"] });
      queryClient.invalidateQueries({
        queryKey: [
          "own-editable-procedure",
          physiotherapistId,
          variables.procedureId,
        ],
      });
    },
  });
}
