import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isDemoOnly = (process.env.NEXT_PUBLIC_DEMO_ONLY ?? "").trim().toLowerCase() === "true";
  const isE2eBypass =
    (process.env.NEXT_PUBLIC_E2E_TESTS ?? "").trim().toLowerCase() === "true" &&
    req.headers.get("x-e2e-auth-bypass") === "1";

  if (isDemoOnly) {
    return NextResponse.next();
  }

  if (isE2eBypass) {
    return NextResponse.next();
  }

  const isPublicPath = req.nextUrl.pathname.startsWith("/api/auth") ||
    req.nextUrl.pathname.startsWith("/auth/signin") ||
    req.nextUrl.pathname.startsWith("/auth/signup") ||
    req.nextUrl.pathname.startsWith("/auth/error") ||
    req.nextUrl.pathname.startsWith("/demo");

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Require authentication for all other routes
  if (!req.auth) {
    const signInUrl = new URL("/auth/signin", req.nextUrl);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
