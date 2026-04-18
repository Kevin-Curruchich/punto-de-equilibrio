import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import React, { useState } from "react";

export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabViewProps {
  tabs: Tab[];
  defaultTabId?: string;
}

export function TabView({ tabs, defaultTabId }: TabViewProps) {
  const [activeTabId, setActiveTabId] = useState(
    defaultTabId || tabs[0]?.id || "",
  );

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  return (
    <Box className="flex-1">
      {/* Tab buttons */}
      <HStack
        space="sm"
        className="border-b border-border bg-card"
        style={{
          overflow: "hidden",
        }}
      >
        {tabs.map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => setActiveTabId(tab.id)}
            className={`flex-1 px-4 py-3 ${
              activeTabId === tab.id
                ? "border-b-2 border-primary"
                : "border-b-2 border-transparent"
            }`}
            style={{
              borderBottomWidth: activeTabId === tab.id ? 2 : 1,
              borderBottomColor:
                activeTabId === tab.id
                  ? "rgb(var(--primary))"
                  : "rgb(var(--border))",
            }}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                activeTabId === tab.id
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </HStack>

      {/* Tab content */}
      <Box className="flex-1">{activeTab?.content}</Box>
    </Box>
  );
}
