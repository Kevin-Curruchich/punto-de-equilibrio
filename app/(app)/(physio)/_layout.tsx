import { Stack } from "expo-router";

export default function PhysioLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        options={{
          title: "",
        }}
      />
      <Stack.Screen
        name="patients"
        options={{
          headerShown: true,
          title: "Pacientes",
        }}
      />
      <Stack.Screen name="procedures" />
      <Stack.Screen name="procedures/editor" />
      <Stack.Screen
        name="sessions/new"
        options={{
          headerShown: true,
          title: "Nueva sesión",
        }}
      />
      <Stack.Screen name="patient/new" />
      <Stack.Screen
        name="patient/[id]"
        options={{
          headerShown: true,
          title: "Paciente",
        }}
      />
      <Stack.Screen
        name="patient/[id]/diagnostic/[conditionId]"
        options={{
          headerShown: true,
          title: "Nuevo diagnostico",
        }}
      />

      <Stack.Screen
        name="patients/conditions/new"
        options={{
          headerShown: true,
          title: "Nuevo diagnostico",
        }}
      />
    </Stack>
  );
}
