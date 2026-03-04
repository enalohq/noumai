"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthErrorPage() {
  const router = useRouter();
  const [errorType, setErrorType] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Get error from URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    const message = urlParams.get("message");

    if (error) {
      setErrorType(error);
      
      // Map error codes to user-friendly messages
      const errorMessages: Record<string, string> = {
        Configuration: "There's a problem with the server configuration. Please contact support.",
        AccessDenied: "You don't have permission to access this resource.",
        Verification: "The verification link is invalid or has expired.",
        CredentialsSignin: "Invalid email or password. Please try again.",
        default: "An authentication error occurred. Please try again.",
      };

      setErrorMessage(message || errorMessages[error] || errorMessages.default);
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-th-bg px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-th-text">Authentication Error</h1>
          <p className="mt-2 text-sm text-th-text-muted">
            {errorType ? `Error: ${errorType}` : "Please try again"}
          </p>
        </div>

        <div className="rounded-xl border border-th-border bg-th-card p-6 shadow-sm">
          {errorMessage && (
            <div className="mb-6 rounded-lg border border-th-danger/30 bg-th-danger-soft p-4 text-sm text-th-danger">
              {errorMessage}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => router.push("/auth/signin")}
              className="w-full rounded-lg bg-th-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-th-accent/90"
            >
              Try Signing In Again
            </button>
            
            <button
              onClick={() => router.push("/auth/signup")}
              className="w-full rounded-lg border border-th-border bg-th-card px-4 py-2.5 text-sm font-medium text-th-text hover:bg-th-card-hover"
            >
              Create New Account
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-th-text-muted">
            <Link href="/" className="font-medium text-th-text-accent hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
