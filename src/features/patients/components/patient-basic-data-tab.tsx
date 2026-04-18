import { Text } from "@/components/ui/text";
import type { PhysioPatientListItem } from "@/src/features/patients/api";
import { PatientForm } from "@/src/features/patients/form";
import type { UseMutationResult } from "@tanstack/react-query";
import { router } from "expo-router";
import { ScrollView } from "react-native";

interface PatientBasicDataTabProps {
  patient: PhysioPatientListItem;
  patientId: string;
  updatePatientMutation: UseMutationResult<
    void,
    Error,
    {
      patientId: string;
      name: string;
      email?: string;
      phone?: string;
      dateOfBirth?: string;
      medicalHistory?: string;
    }
  >;
}

export function PatientBasicDataTab({
  patient,
  patientId,
  updatePatientMutation,
}: PatientBasicDataTabProps) {
  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingBottom: 32,
      }}
    >
      <Text className="mb-4 text-xs font-semibold uppercase text-muted-foreground">
        Informacion del paciente
      </Text>

      <PatientForm
        initialValues={{
          name: patient.name,
          email: patient.email ?? "",
          phone: patient.phone ?? "",
          dateOfBirth: patient.dateOfBirth ?? "",
          medicalHistory: patient.medicalHistory ?? "",
        }}
        submitLabel="Guardar cambios"
        submitPendingLabel="Guardando..."
        isSubmitting={updatePatientMutation.isPending}
        errorMessage={
          updatePatientMutation.isError
            ? (updatePatientMutation.error as Error).message
            : null
        }
        onCancel={() => router.back()}
        onSubmit={async (values) => {
          await updatePatientMutation.mutateAsync({
            patientId,
            name: values.name,
            email: values.email,
            phone: values.phone,
            dateOfBirth: values.dateOfBirth,
            medicalHistory: values.medicalHistory,
          });

          router.back();
        }}
      />
    </ScrollView>
  );
}
