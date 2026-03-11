"use client";

export function ErrorBoundaryCrash(): JSX.Element {
  throw new Error("E2E error boundary crash");
}
