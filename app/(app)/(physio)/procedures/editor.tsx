import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { VStack } from "@/components/ui/vstack";
import {
  useCreateProcedure,
  useOwnEditableProcedure,
  useUpdateOwnProcedure,
} from "@/src/features/procedures/hooks";
import { useAuthStore } from "@/src/store/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView } from "react-native";
import { z } from "zod";

const procedureSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  description: z.string().optional(),
  category: z.string().optional(),
  isPublic: z.boolean(),
});

type ProcedureFormValues = z.infer<typeof procedureSchema>;

export default function ProcedureEditorScreen() {
  const { procedureId, initialName } = useLocalSearchParams<{
    procedureId?: string;
    initialName?: string;
  }>();

  const user = useAuthStore((state) => state.user);
  const physiotherapistId = user?.id ?? null;
  const editingProcedureId =
    typeof procedureId === "string" && procedureId.length > 0
      ? procedureId
      : null;

  const [submitError, setSubmitError] = useState<string | null>(null);

  const createProcedureMutation = useCreateProcedure(physiotherapistId);
  const updateOwnProcedureMutation = useUpdateOwnProcedure(physiotherapistId);
  const editableProcedureQuery = useOwnEditableProcedure(
    physiotherapistId,
    editingProcedureId,
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProcedureFormValues>({
    resolver: zodResolver(procedureSchema),
    defaultValues: {
      name: typeof initialName === "string" ? initialName : "",
      description: "",
      category: "",
      isPublic: false,
    },
  });

  useEffect(() => {
    if (!editableProcedureQuery.data) {
      return;
    }

    reset({
      name: editableProcedureQuery.data.name,
      description: editableProcedureQuery.data.description ?? "",
      category: editableProcedureQuery.data.category ?? "",
      isPublic: editableProcedureQuery.data.isPublic,
    });
  }, [editableProcedureQuery.data, reset]);

  const isEditing = Boolean(editingProcedureId);
  const isLoadingEditData = isEditing && editableProcedureQuery.isLoading;
  const isSubmitting =
    createProcedureMutation.isPending || updateOwnProcedureMutation.isPending;

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSubmitError(null);

      if (isEditing && editingProcedureId) {
        await updateOwnProcedureMutation.mutateAsync({
          procedureId: editingProcedureId,
          name: values.name,
          description: values.description,
          category: values.category,
          isPublic: values.isPublic,
        });
      } else {
        await createProcedureMutation.mutateAsync({
          name: values.name,
          description: values.description,
          category: values.category,
          isPublic: values.isPublic,
        });
      }

      router.back();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "No se pudo guardar.",
      );
    }
  });

  if (isLoadingEditData) {
    return (
      <Box className="flex-1 items-center justify-center bg-background px-6">
        <VStack space="sm" className="items-center">
          <Spinner />
          <Text className="text-muted-foreground">
            Cargando procedimiento...
          </Text>
        </VStack>
      </Box>
    );
  }

  if (isEditing && editableProcedureQuery.isError) {
    return (
      <Box className="flex-1 items-center justify-center bg-background px-6">
        <VStack space="md" className="w-full max-w-[420px] items-center">
          <Text className="text-center text-destructive">
            {(editableProcedureQuery.error as Error)?.message ||
              "No se pudo cargar el procedimiento para editar."}
          </Text>
          <Button variant="outline" onPress={() => router.back()}>
            <ButtonText>Volver</ButtonText>
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 56,
          paddingBottom: 32,
        }}
      >
        <Heading size="3xl">
          {isEditing ? "Editar procedimiento" : "Nuevo procedimiento"}
        </Heading>
        <Text className="mt-1 text-muted-foreground">
          {isEditing
            ? "Edita tu procedimiento propio."
            : "Crea un procedimiento para usarlo en sesiones."}
        </Text>

        {submitError ? (
          <Box className="mt-4 rounded-md border border-destructive bg-destructive/10 p-3">
            <Text className="text-sm text-destructive">{submitError}</Text>
          </Box>
        ) : null}

        <VStack space="md" className="mt-6">
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange } }) => (
              <FormControl isInvalid={Boolean(errors.name)}>
                <FormControlLabel>
                  <FormControlLabelText>Nombre *</FormControlLabelText>
                </FormControlLabel>
                <Input className="bg-card">
                  <InputField
                    value={value}
                    onChangeText={onChange}
                    placeholder="Ej: Radiofrecuencia"
                  />
                </Input>
                {errors.name ? (
                  <FormControlError>
                    <FormControlErrorText>
                      {errors.name.message}
                    </FormControlErrorText>
                  </FormControlError>
                ) : null}
              </FormControl>
            )}
          />

          <Controller
            control={control}
            name="category"
            render={({ field: { value, onChange } }) => (
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText>Categoría</FormControlLabelText>
                </FormControlLabel>
                <Input className="bg-card">
                  <InputField
                    value={value}
                    onChangeText={onChange}
                    placeholder="Ej: Electroterapia"
                  />
                </Input>
              </FormControl>
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { value, onChange } }) => (
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText>Descripción</FormControlLabelText>
                </FormControlLabel>
                <Textarea className="bg-card">
                  <TextareaInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="Describe cuándo y cómo se aplica"
                  />
                </Textarea>
              </FormControl>
            )}
          />

          <Controller
            control={control}
            name="isPublic"
            render={({ field: { value, onChange } }) => (
              <VStack space="xs">
                <Text className="text-sm font-medium text-foreground">
                  Visibilidad
                </Text>
                <HStack space="sm">
                  <Button
                    className="flex-1"
                    variant={value ? "outline" : "default"}
                    onPress={() => onChange(false)}
                  >
                    <ButtonText>Solo yo</ButtonText>
                  </Button>
                  <Button
                    className="flex-1"
                    variant={value ? "default" : "outline"}
                    onPress={() => onChange(true)}
                  >
                    <ButtonText>Público</ButtonText>
                  </Button>
                </HStack>
              </VStack>
            )}
          />

          <HStack space="sm" className="mt-2">
            <Button
              className="flex-1"
              variant="outline"
              onPress={() => router.back()}
              disabled={isSubmitting}
            >
              <ButtonText>Cancelar</ButtonText>
            </Button>
            <Button
              className="flex-1"
              onPress={onSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Spinner size="small" />
              ) : (
                <ButtonText>
                  {isEditing ? "Guardar cambios" : "Crear procedimiento"}
                </ButtonText>
              )}
            </Button>
          </HStack>
        </VStack>
      </ScrollView>
    </Box>
  );
}
