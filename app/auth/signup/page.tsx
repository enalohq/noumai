"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Redirect to signin page
      router.push("/auth/signin?registered=true");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-th-bg px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-th-text">Create Account</h1>
          <p className="mt-2 text-sm text-th-text-muted">
            Start tracking your AI visibility
          </p>
        </div>

        <div className="rounded-xl border border-th-border bg-th-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
            {error && (
              <div className="rounded-lg border border-th-danger/30 bg-th-danger-soft p-3 text-sm text-th-danger">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-th-text">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bd-input w-full rounded-lg p-2.5 text-sm"
                placeholder="John Doe"
                required
                disabled={loading}
                suppressHydrationWarning
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-th-text">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bd-input w-full rounded-lg p-2.5 text-sm"
                placeholder="you@example.com"
                required
                disabled={loading}
                suppressHydrationWarning
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-th-text">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bd-input w-full rounded-lg p-2.5 pr-10 text-sm"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-th-text-muted hover:text-th-text"
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  suppressHydrationWarning
                >
                  {showPassword ? (
                    <EyeInvisibleOutlined style={{ fontSize: '16px' }} />
                  ) : (
                    <EyeOutlined style={{ fontSize: '16px' }} />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-th-text-muted">
                Must be at least 8 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-th-text">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bd-input w-full rounded-lg p-2.5 pr-10 text-sm"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-th-text-muted hover:text-th-text"
                  disabled={loading}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  suppressHydrationWarning
                >
                  {showConfirmPassword ? (
                    <EyeInvisibleOutlined style={{ fontSize: '16px' }} />
                  ) : (
                    <EyeOutlined style={{ fontSize: '16px' }} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-th-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-th-accent/90 disabled:opacity-50"
              suppressHydrationWarning
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-th-text-muted">
            Already have an account?{" "}
            <Link href="/auth/signin" className="font-medium text-th-text-accent hover:underline">
              Sign in
            </Link>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-th-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-th-card px-2 text-th-text-muted">Or sign up with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  // Google signup would be handled by NextAuth
                  window.location.href = "/api/auth/signin?provider=google";
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-th-border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={loading}
                suppressHydrationWarning
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign up with Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}