"use client";

import { useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

// When NEXT_PUBLIC_TURNSTILE_SITE_KEY is set in .env the real Cloudflare widget
// is shown. Until then, a simulated checkbox is used so the UI works locally.
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function TurnstileWidget({
  verified,
  onVerify,
}: {
  verified: boolean;
  onVerify: (token: string) => void;
}) {
  // ── Real Cloudflare Turnstile (activated once site key is configured) ──────
  if (SITE_KEY) {
    if (verified) {
      return (
        <div className="flex items-center gap-3 bg-[#f0faf4] border border-[#b7e5c6] rounded-md px-4 py-3">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-[#00b140]">
            <svg
              className="w-4 h-4 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="text-sm text-[#1a7f37] font-medium">
            Verification successful
          </span>
        </div>
      );
    }
    return (
      <Turnstile
        siteKey={SITE_KEY}
        onSuccess={onVerify}
        options={{ theme: "light", size: "flexible" }}
      />
    );
  }

  // ── Simulated widget (used until Turnstile site key is provided) ──────────
  return <SimulatedWidget verified={verified} onVerify={onVerify} />;
}

function SimulatedWidget({
  verified,
  onVerify,
}: {
  verified: boolean;
  onVerify: (token: string) => void;
}) {
  const [checking, setChecking] = useState(false);

  const handleClick = () => {
    if (verified || checking) return;
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      onVerify("simulated-token");
    }, 1200);
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center justify-between bg-[#f9f9f9] border border-[#e0e0e0] rounded-md px-4 py-3 cursor-pointer select-none"
      style={{ minHeight: 64 }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-all duration-300 ${
            verified
              ? "bg-[#00b140] border-[#00b140]"
              : checking
                ? "border-[#f5a623] border-dashed animate-spin"
                : "border-[#aaa] bg-card"
          }`}
        >
          {verified && (
            <svg
              className="w-4 h-4 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
        <span className="text-sm text-foreground font-medium">
          {verified ? "Success!" : checking ? "Verifying…" : "I am human"}
        </span>
      </div>

      <div className="flex flex-col items-end gap-0.5">
        {/* Cloudflare logo mark */}
        <svg
          className="h-5 w-auto"
          viewBox="0 0 109 42"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M78.5 27.2c.3-1 .2-2-.5-2.7-.6-.7-1.6-1.1-2.7-1.1l-21.8-.3c-.2 0-.3-.1-.4-.2-.1-.1-.1-.3 0-.4.1-.3.4-.5.7-.5l22-.3c2.6-.1 5.4-2.2 6.4-4.7l1.2-3.3c.1-.2.1-.4 0-.6C81.2 6.3 75.1 2 68 2 62.3 2 57.4 5 54.8 9.5c-1.3-.9-2.9-1.4-4.6-1.3-3.1.2-5.6 2.7-5.8 5.8-.1.6 0 1.2.1 1.8C40.9 16 38 19.2 38 23c0 .4 0 .7.1 1.1.1.2.3.4.5.4h39.3c.3 0 .5-.2.6-.5l.1-.8Z"
            fill="#F6821F"
          />
          <path
            d="M85 17.5h-.6c-.2 0-.4.1-.5.3l-.8 2.8c-.3 1-.2 2 .5 2.7.6.7 1.6 1.1 2.7 1.1l1.3.3c.2 0 .3.1.4.2.1.1.1.3 0 .4-.1.3-.4.5-.7.5l-1.5.3c-2.6.1-5.4 2.2-6.4 4.7l-.3.8c-.1.2.1.4.3.4H95c.2 0 .4-.2.5-.4.3-1 .5-2.1.5-3.2C96 23.3 91.1 17.5 85 17.5Z"
            fill="#FBAD41"
          />
        </svg>
        <span className="text-[10px] text-muted-foreground leading-none">
          Privacy · Help
        </span>
      </div>
    </div>
  );
}
