import { Box } from "@/components/ui/box";
import React from "react";
import { Dimensions, Pressable, Modal as RNModal } from "react-native";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "full";
}

const SIZE_MAP = {
  sm: "w-72",
  md: "w-96",
  lg: "w-full",
  full: "w-full",
};

export function Modal({ isOpen, onClose, children, size = "md" }: ModalProps) {
  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Box className="flex-1 items-center justify-center bg-black/50">
        <Box className={`${SIZE_MAP[size]} rounded-lg overflow-hidden`}>
          {children}
        </Box>
      </Box>
    </RNModal>
  );
}

export function ModalBackdrop({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      }}
    />
  );
}

export function ModalContent({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: Record<string, unknown>;
}) {
  return (
    <Box
      className="rounded-lg bg-card p-6"
      style={{
        maxHeight: Dimensions.get("window").height * 0.8,
        ...style,
      }}
    >
      {children}
    </Box>
  );
}
