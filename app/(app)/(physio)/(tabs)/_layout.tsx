import { IconSymbol } from "@/components/ui/icon-symbol";
import { Tabs } from "expo-router";

export default function PhysioTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={22} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: "Pacientes",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={22} name="person.2.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: "Sesiones",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={22} name="calendar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="procedures"
        options={{
          title: "Procedimientos",
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={22}
              name="list.bullet.clipboard.fill"
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
