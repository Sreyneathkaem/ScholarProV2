import { NextRequest, NextResponse } from "next/server";
import type { OAuthCallbackResponse } from "@/lib/types/auth";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://api.scholarpro.work/api/v1";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Collect all fields the Telegram widget sends.
  const telegramData: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    telegramData[key] = value;
  }

  // `id` and `hash` are the minimum required fields for verification.
  if (!telegramData.hash || !telegramData.id) {
    return NextResponse.redirect(
      new URL("/students/login?error=telegram_auth_failed", req.url),
    );
  }

  try {
    const res = await fetch(`${BACKEND_URL}/auth/telegram/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(telegramData),
    });

    if (!res.ok) {
      return NextResponse.redirect(
        new URL("/students/login?error=telegram_auth_failed", req.url),
      );
    }

    const data = (await res.json()) as OAuthCallbackResponse;
    const token = data.data?.accessToken;

    if (!token) {
      return NextResponse.redirect(
        new URL("/students/login?error=telegram_auth_failed", req.url),
      );
    }

    const response = NextResponse.redirect(
      new URL("/students/profile", req.url),
    );
    response.cookies.set("accessToken", token, {
      httpOnly: false, // Must be readable by the apiClient interceptor.
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15, // 15 min
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/students/login?error=server_error", req.url),
    );
  }
}
