"use client";

import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PageHeader } from "@/components/header/header";
import { HeaderProvider } from "@/components/header/header-context";

export default function StudentLayout({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const isPublicLanding = pathname === "/students" || pathname === "/students/";

  const isAuthPages =
    pathname?.startsWith("/students/login") ||
    pathname?.startsWith("/students/signup") ||
    pathname?.startsWith("/students/auth/") ||
    pathname?.startsWith("/api/v1/auth/");

  useEffect(() => {
    if (isPublicLanding || isAuthPages) return;
    if (isLoading) return;

    if (user?.role !== "student") {
      const hasStoredSession =
        typeof window !== "undefined" &&
        Boolean(sessionStorage.getItem("studentAccessToken"));

      if (!hasStoredSession) {
        router.replace("/students/login");
      }
    }
  }, [isPublicLanding, isAuthPages, pathname, router, user, isLoading]);

  if (isPublicLanding || isAuthPages) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar role="student" />
      <SidebarInset className="min-h-svh bg-background flex flex-col min-w-0">
        <HeaderProvider>
          <PageHeader showNotifications showProfile />
          <div className="flex-1 bg-background min-w-0">
            {children}
          </div>
        </HeaderProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
