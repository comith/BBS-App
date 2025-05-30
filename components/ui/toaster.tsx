// components/ui/toaster.tsx
"use client";

import * as React from "react";
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          backgroundColor: "white",
          color: "black",
          border: "1px solid white",
          borderRadius: "0.5rem",
          padding: "1rem",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        },
        duration: 4000,
      }}
    />
  );
}