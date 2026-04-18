import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import {
  PatientForm,
  initialPatientFormValues,
} from "@/src/features/patients/form";
import { useCreatePatient } from "@/src/features/patients/hooks";
import { useAuthStore } from "@/src/store/auth";
import { router } from "expo-router";
import { ScrollView } from "react-native";

export default function NewPatientScreen() {
  const user = useAuthStore((state) => state.user);
  const physiotherapistId = user?.id ?? null;
  const createPatientMutation = useCreatePatient(physiotherapistId);

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: 56,
        paddingHorizontal: 16,
        paddingBottom: 32,
      }}
      style={{ backgroundColor: "rgb(var(--background))" as never }}
    >
      <Heading size="3xl">Nuevo paciente</Heading>
      <Text className="mb-4 mt-1 text-muted-foreground">
        Completa la información base del paciente.
      </Text>

      <PatientForm
        initialValues={initialPatientFormValues}
        submitLabel="Guardar paciente"
        submitPendingLabel="Guardando..."
        isSubmitting={createPatientMutation.isPending}
        errorMessage={
          createPatientMutation.isError
            ? (createPatientMutation.error as Error).message
            : null
        }
        onCancel={() => router.back()}
        onSubmit={async (values) => {
          await createPatientMutation.mutateAsync(values);
          router.back();
        }}
      />
    </ScrollView>
  );
}
