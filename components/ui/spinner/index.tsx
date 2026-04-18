"use client";
import React from "react";
import { ActivityIndicator } from "react-native";

const Spinner = React.forwardRef<
  React.ComponentRef<typeof ActivityIndicator>,
  React.ComponentProps<typeof ActivityIndicator> & { className?: string }
>(function Spinner(
  { color, focusable = false, "aria-label": ariaLabel = "loading", ...props },
  ref,
) {
  return (
    <ActivityIndicator
      ref={ref}
      focusable={focusable}
      aria-label={ariaLabel}
      {...props}
      color={color}
    />
  );
});

Spinner.displayName = "Spinner";

export { Spinner };
