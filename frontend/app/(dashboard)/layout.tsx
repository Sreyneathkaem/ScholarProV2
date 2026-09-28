"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PageHeader } from "@/components/header/header";
import { HeaderProvider } from "@/components/header/header-context";
import { useAuth, useRole } from "@/lib/context/auth-context";
import { usePathname } from "next/navigation";
import { notFound } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const { canAccessRoute } = useRole();
  const pathname = usePathname();

  const role = user?.role || "committee";

  // role-based route protection (using JWT verified role)
  useEffect(() => {
    if (!isLoading && user && !canAccessRoute(pathname)) {
      notFound(); // Trigger 404 page (route masking)
    }
  }, [pathname, user, isLoading, canAccessRoute]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <div className="text-xs text-muted-foreground">Authenticating session...</div>
        </div>
      </div>
    );
  }

  // If unauthorized, don't render layout
  if (user && !canAccessRoute(pathname)) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar role={role} />
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
