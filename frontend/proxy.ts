import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Check if refresh token cookie exists
  const hasRefreshToken = req.cookies.has("refreshToken");

  // Public routes that don't require authentication
  const publicPaths = [
    "/login",
    "/forgot-password",
    "/set-forgot-password",
    "/reset-password",
    "/committee-login",
    "/students",
  ];

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // If NOT a public route and no session, redirect to login
  if (!isPublicPath && !hasRefreshToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Generate a random nonce for this specific request
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const isDev = process.env.NODE_ENV !== "production";

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' ${isDev ? "'unsafe-eval'" : ""};
    worker-src 'self' blob:;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*.scholarpro.work https://*.scholarpro.site https://app.projectesting.site;
    connect-src 'self' https://*.scholarpro.work https://*.scholarpro.site https://projectesting.site https://app.projectesting.site;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;

  // Clean up the header string (remove newlines)
  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, " ")
    .trim();

  // Prepare the headers
  const requestHeaders = new Headers(req.headers);

  // IMPORTANT: We send the nonce to Next.js via request headers
  // Next.js automatically reads 'x-nonce' and adds it to its internal scripts
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(
    "Content-Security-Policy",
    contentSecurityPolicyHeaderValue,
  );

  // Create the response with the new request headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Set the CSP header on the response so the browser enforces it
  response.headers.set(
    "Content-Security-Policy",
    contentSecurityPolicyHeaderValue,
  );

  return response;
}

export const config = {
  // Match all routes EXCEPT API routes, static files, and images/assets
  // This ensures authentication check runs on all pages but skips public assets
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|assets).*)"],
};
