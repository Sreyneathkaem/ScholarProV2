"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authService } from "@/api/service/auth.service";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";

import {
  saveStudentPortalSnapshot,
  formatNameFromEmail,
} from "@/lib/utils/student-portal";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [message, setMessage] = useState("Signing you in…");

  // Prevent React 18 Strict Mode double-invocation from firing the exchange twice.
  // Google auth codes are single-use — a second call with the same code fails.
  const hasExchanged = useRef(false);

  useEffect(() => {
    if (hasExchanged.current) return;
    hasExchanged.current = true;

    // Read params directly from the browser URL rather than useSearchParams().
    // Next.js server-side rewrites do not always propagate query params through
    // the App Router's useSearchParams() hook on static destination pages.
    const params = new URLSearchParams(window.location.search);

    const error = params.get("error");
    if (error) {
      setStatus("error");
      setMessage(error);
      return;
    }

    /**
     * `mode` is either:
     *   "code"   — Google's redirect_uri points at this page, so the single-use
     *              authorization code is exchanged here.
     *   "session"— Google's redirect_uri points at the backend. The backend has
     *              already exchanged the code and set the httpOnly refreshToken
     *              cookie, so an access token is obtained by refreshing instead.
     *              Passing a used code back to the backend would fail: Google
     *              auth codes are single-use.
     */
    const handleCallback = async (mode: "code" | "session") => {
      try {
        let token: string;
        let userProfile: {
          id: string | number;
          name?: string;
          email: string;
          role: string;
          profileUrl?: string | null;
          avatar?: string;
        };

        if (mode === "code") {
          const res = await authService.postGoogleCallback(code!, state ?? undefined);

          if (!res.success || !res.data) {
            throw new Error(res.message || "Invalid response from server");
          }

          token = res.data.accessToken;
          userProfile = res.data.userProfile;
        } else {
          ({ token } = await authService.refreshToken());

          // The interceptor reads the token from the store, so publish it
          // before asking for the profile.
          setAccessToken(token);

          const me = await authService.me();
          if (!me.success || !me.data) {
            throw new Error("Could not load your profile");
          }
          userProfile = {
            ...me.data,
            profileUrl: me.data.avatar ?? null,
          };
        }

        const resolvedName =
          userProfile.name?.trim() || formatNameFromEmail(userProfile.email);

        const studentUser = {
          id: String(userProfile.id),
          name: resolvedName,
          email: userProfile.email,
          role: userProfile.role as "student",
          avatar: userProfile.profileUrl ?? userProfile.avatar ?? undefined,
        };

        // Persist to sessionStorage FIRST — survives page refreshes, cleared on tab close.
        sessionStorage.setItem("studentAccessToken", token);
        sessionStorage.setItem("studentUser", JSON.stringify(studentUser));

        saveStudentPortalSnapshot(
          {
            profile: {
              name: resolvedName,
              email: userProfile.email,
              phone: "—",
              studentId: "APP-001",
            },
          },
          userProfile.email,
        );

        // Update in-memory Zustand store
        setAccessToken(token);
        setUser(studentUser);

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("student-profile-updated"));
        }

        toast.success("Welcome! You are now signed in.");
        router.replace("/students/application");
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Sign-in failed. Please try again.";
        setStatus("error");
        setMessage(msg);
      }
    };

    // params.get() auto-decodes percent-encoded characters (%2F → /)
    const code = params.get("code");
    const urlState = params.get("state");

    // Prefer the state stashed before the redirect. Google's echo of `state`
    // comes back through the proxy just like the code does, but the copy in
    // sessionStorage is the one guaranteed to belong to this browser — it is
    // what makes the CSRF check work when the state cookie cannot be forwarded.
    let storedState: string | null = null;
    try {
      storedState = sessionStorage.getItem("googleOauthState");
      sessionStorage.removeItem("googleOauthState");
    } catch {
      // storage unavailable
    }

    const state = storedState ?? urlState;

    // If both exist they must agree — that mismatch is a genuine replay attempt.
    if (storedState && urlState && storedState !== urlState) {
      setStatus("error");
      setMessage(
        "Sign-in could not be verified. Please start again from the sign-in page.",
      );
      return;
    }

    if (params.get("session") === "1") {
      handleCallback("session");
    } else if (code) {
      handleCallback("code");
    } else {
      setStatus("error");
      setMessage("Invalid callback — missing auth code. Please try again.");
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-14 h-14 mb-6">
        <Image
          src="/login.png"
          alt="ScholarPro"
          width={56}
          height={56}
          className="w-full h-full object-cover"
        />
      </div>

      {status === "loading" ? (
        <>
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground text-sm">{message}</p>
        </>
      ) : (
        <>
          <p className="text-red-600 font-medium mb-2">Authentication failed</p>
          <p className="text-muted-foreground text-sm mb-5 text-center max-w-xs">
            {message}
          </p>
          <button
            onClick={() => router.push("/students")}
            className="text-blue-600 text-sm font-semibold hover:underline underline-offset-2"
          >
            Back to sign-in
          </button>
        </>
      )}
    </div>
  );
}
