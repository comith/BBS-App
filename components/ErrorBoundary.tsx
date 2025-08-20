"use client";
import React from "react";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("NotificationManager error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null; // หรือแสดง fallback UI
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
