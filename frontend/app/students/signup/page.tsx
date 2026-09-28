"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import TelegramWhite from "@/components/icons/TelegramWhite";
import GoogleColor from "@/components/icons/GoogleColor";
import TurnstileWidget from "@/components/auth/TurnstileWidget";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentSignupPage() {
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
  }, []);

  const handleGoogle = async () => {
    if (!captchaVerified) {
      toast.error("Please complete the CAPTCHA verification first");
      return;
    }
    window.location.href = `/api/auth/google${captchaToken ? `?captcha=${encodeURIComponent(captchaToken)}` : ""}`;
  };

  const handleTelegram = async () => {
    if (!captchaVerified) {
      toast.error("Please complete the CAPTCHA verification first");
      return;
    }
    const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME;
    if (!botName) {
      toast.info(
        "Telegram sign-in is not configured yet. Please use Google to sign in.",
      );
      return;
    }
    const callbackUrl = encodeURIComponent(
      `${window.location.origin}/api/auth/telegram/callback`,
    );
    window.location.href = `https://oauth.telegram.org/auth?bot_id=${botName}&origin=${encodeURIComponent(window.location.origin)}&return_to=${callbackUrl}&request_access=write`;
  };

  return (
    <>
      <div className="fixed inset-0 bg-background transition-colors" style={{ zIndex: 0 }} />
      <AnimatedBackground />

      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div
        className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10"
        style={{ zIndex: 1 }}
      >
        <div
          className={`w-full max-w-sm transition-all duration-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="bg-card text-card-foreground border border-border/80 rounded-lg p-8 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 relative">
                <Image
                  src="/login.png"
                  alt="ScholarPro"
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <h1 className="text-foreground text-[1.1rem] font-semibold text-center leading-snug mb-7">
              Continue to ScholarPro Student
            </h1>

            <div className="space-y-3 mb-5">
              <Button
                onClick={handleGoogle}
                variant="outline"
                className="w-full flex items-center justify-start gap-3 rounded-md px-4 py-3 text-sm h-11"
              >
                <GoogleColor size={24} className="shrink-0" />
                <span className="flex-1 text-center font-medium">Continue with Google</span>
              </Button>

              <Button
                onClick={handleTelegram}
                className="w-full flex items-center justify-start gap-3 bg-[#26a5e4] hover:bg-[#1fa1db] active:bg-[#158fc0] rounded-md px-4 py-3 text-white text-sm h-11"
              >
                <TelegramWhite size={20} className="shrink-0" />
                <span className="flex-1 text-center font-medium">
                  Continue with Telegram
                </span>
              </Button>
            </div>

            <TurnstileWidget
              verified={captchaVerified}
              onVerify={(token) => {
                setCaptchaToken(token);
                setCaptchaVerified(true);
              }}
            />

            <div className="my-5 flex items-center gap-3">
              <hr className="flex-1 border-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <hr className="flex-1 border-border" />
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={() => router.push("/students")}
                className="text-primary font-semibold hover:underline underline-offset-2 transition-colors cursor-pointer"
              >
                Sign in
              </button>
            </p>

            <p className="text-center text-[11px] text-muted-foreground mt-5">
              Powered by ScholarPro
            </p>
          </div>
        </div>

        <div
          className={`mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground transition-all duration-700 delay-200 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <a
            href="/terms"
            className="hover:text-foreground transition-colors underline-offset-2 hover:underline"
          >
            Terms of Service
          </a>
          <span>·</span>
          <a
            href="/privacy"
            className="hover:text-foreground transition-colors underline-offset-2 hover:underline"
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </>
  );
}
