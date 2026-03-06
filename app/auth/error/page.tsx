"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function AuthErrorPage() {
  const router = useRouter();
  const [errorType, setErrorType] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLinking, setIsLinking] = useState(false);

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
        OAuthAccountNotLinked: "This account is already registered with a different sign-in method. We can link your accounts automatically.",
        default: "An authentication error occurred. Please try again.",
      };

      setErrorMessage(message || errorMessages[error] || errorMessages.default);
    }
  }, []);

  /**
   * Handle automatic account linking for OAuth errors
   * Follows SRP by focusing only on the linking action
   */
  const handleAccountLinking = async () => {
    if (errorType !== "OAuthAccountNotLinked") return;
    
    setIsLinking(true);
    try {
      // Attempt to sign in with Google again - this time it should work with allowDangerousEmailAccountLinking
      const result = await signIn("google", { 
        callbackUrl: "/",
        redirect: false 
      });
      
      if (result?.ok) {
        // Success - redirect to home or onboarding
        router.push("/");
      } else if (result?.error) {
        // Still failed - show error
        setErrorMessage("Account linking failed. Please try signing in with your original method first, then link accounts from your profile settings.");
      }
    } catch (error) {
      console.error("Account linking error:", error);
      setErrorMessage("An error occurred while linking accounts. Please try again.");
    } finally {
      setIsLinking(false);
    }
  };

  /**
   * Render account linking UI for OAuthAccountNotLinked errors
   * Follows ISP by providing specific interface for this error type
   */
  const renderAccountLinkingUI = () => {
    if (errorType !== "OAuthAccountNotLinked") return null;

    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-th-accent/30 bg-th-accent-soft p-4 text-sm">
          <h3 className="font-medium text-th-accent mb-2">Account Linking Available</h3>
          <p className="text-th-text-muted">
            It looks like you already have an account with this email address using a different sign-in method. 
            We can automatically link your accounts so you can sign in with either method.
          </p>
        </div>

        <button
          onClick={handleAccountLinking}
          disabled={isLinking}
          className="w-full rounded-lg bg-th-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-th-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLinking ? "Linking Accounts..." : "Link Accounts & Sign In"}
        </button>

        <div className="text-center text-sm text-th-text-muted">
          <p>Or sign in with your original method:</p>
        </div>
      </div>
    );
  };

  /**
   * Render standard error UI for other error types
   * Follows SRP by handling only standard error display
   */
  const renderStandardErrorUI = () => {
    if (errorType === "OAuthAccountNotLinked") return null;

    return (
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
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-th-bg px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-th-text">
            {errorType === "OAuthAccountNotLinked" ? "Account Linking" : "Authentication Error"}
          </h1>
          <p className="mt-2 text-sm text-th-text-muted">
            {errorType ? `Error: ${errorType}` : "Please try again"}
          </p>
        </div>

        <div className="rounded-xl border border-th-border bg-th-card p-6 shadow-sm">
          {errorMessage && (
            <div className={`mb-6 rounded-lg border p-4 text-sm ${
              errorType === "OAuthAccountNotLinked" 
                ? "border-th-accent/30 bg-th-accent-soft text-th-accent" 
                : "border-th-danger/30 bg-th-danger-soft text-th-danger"
            }`}>
              {errorMessage}
            </div>
          )}

          {renderAccountLinkingUI()}
          {renderStandardErrorUI()}

          <div className="mt-6 space-y-2">
            <button
              onClick={() => router.push("/auth/signin")}
              className="w-full rounded-lg border border-th-border bg-th-card px-4 py-2.5 text-sm font-medium text-th-text hover:bg-th-card-hover"
            >
              Back to Sign In
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
