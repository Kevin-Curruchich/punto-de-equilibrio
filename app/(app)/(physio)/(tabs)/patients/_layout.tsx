import { Stack } from "expo-router";

export default function PatientsStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        options={{
          title: "",
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          headerShown: true,
          title: "Nuevo paciente",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          title: "Paciente",
        }}
      />
      <Stack.Screen
        name="[id]/diagnostic/[conditionId]"
        options={{
          headerShown: true,
          title: "Diagnóstico",
        }}
      />
      <Stack.Screen
        name="[id]/diagnostic/new"
        options={{
          headerShown: true,
          title: "Nuevo diagnóstico",
        }}
      />
    </Stack>
  );
}
