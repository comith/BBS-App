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