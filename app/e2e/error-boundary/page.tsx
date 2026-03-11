import { notFound } from "next/navigation";
import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorBoundaryCrash } from "./crash";

export default function ErrorBoundaryTestPage() {
  if ((process.env.NEXT_PUBLIC_E2E_TESTS ?? "").trim().toLowerCase() !== "true") {
    notFound();
  }

  return (
    <ErrorBoundary>
      <ErrorBoundaryCrash />
    </ErrorBoundary>
  );
}
