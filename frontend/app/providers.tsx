"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { AuthProvider } from "@/lib/context/auth-context";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

export function Providers({
  children,
  nonce,
}: {
  children: React.ReactNode;
  nonce?: string;
}) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} styleNonce={nonce} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
