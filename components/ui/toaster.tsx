// components/ui/toaster.tsx
"use client";

import * as React from "react";
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: "white",
          color: "black",
          border: "1px solid #e2e8f0",
          borderRadius: "0.5rem",
          padding: "1rem",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        },
        duration: 4000,
      }}
    />
  );
}

// components/ui/use-toast.ts
"use client";

import * as React from "react";
import { toast as sonnerToast, type ToastT } from "sonner";

type ToastProps = {
  title: string;
  description?: string;
  variant?: "default" | "success" | "destructive";
};

export function useToast() {
  const styles = {
    success: {
      icon: "✅",
      className: "border-green-500 bg-green-50",
    },
    destructive: {
      icon: "⚠️",
      className: "border-red-500 bg-red-50",
    },
    default: {
      icon: "ℹ️",
      className: "",
    },
  };

  return {
    toast: ({ title, description, variant = "default" }: ToastProps) => {
      const { icon, className } = styles[variant] || styles.default;
      
      sonnerToast(title, {
        description,
        icon,
        className,
      });
    },

    // Shortcuts for common toast types
    success: (title: string, description?: string) => {
      const { icon, className } = styles.success;
      
      sonnerToast(title, {
        description,
        icon,
        className,
      });
    },

    error: (title: string, description?: string) => {
      const { icon, className } = styles.destructive;
      
      sonnerToast(title, {
        description,
        icon,
        className,
      });
    },
  };
}

export { sonnerToast as toast };