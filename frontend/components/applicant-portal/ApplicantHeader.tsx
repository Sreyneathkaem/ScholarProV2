"use client";

import { Bell, LogOut, PanelLeftIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  getStudentDisplayName,
  getStudentInitials,
  getStudentRoleLabel,
} from "@/lib/utils/student-portal";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ApplicantHeader({
  title = "University Admissions Portal",
  className,
  onToggleSidebar,
}: {
  title?: string;
  className?: string;
  collapsed?: boolean;
  onToggleSidebar?: () => void;
}) {
  const { user, logout } = useAuth();
  const [userName, setUserName] = useState<string>("Student");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("Applicant");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    const syncUser = () => {
      const name = getStudentDisplayName(user);
      const role = getStudentRoleLabel(user?.role);
      let email = user?.email || "";

      if (!email && typeof window !== "undefined") {
        try {
          const stored = sessionStorage.getItem("studentUser");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.email) email = parsed.email;
          }
        } catch {}
      }

      setUserName(name);
      setUserEmail(email);
      setUserRole(role);
      setAvatarUrl(user?.avatar);
    };

    syncUser();

    if (typeof window !== "undefined") {
      window.addEventListener("student-profile-updated", syncUser);
      window.addEventListener("storage", syncUser);
      return () => {
        window.removeEventListener("student-profile-updated", syncUser);
        window.removeEventListener("storage", syncUser);
      };
    }
  }, [user]);

  const initials = getStudentInitials(userName);

  return (
    <header
      className={cn(
        "hidden lg:flex items-center justify-between px-6 h-16 border-b border-border bg-background sticky top-0 z-40 transition-colors",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer relative z-50"
        >
          <PanelLeftIcon className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <button
          aria-label="Notifications"
          className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 inline-flex h-2 w-2 rounded-full bg-destructive" />
        </button>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Account menu"
              >
                <Avatar className="border border-border">
                  <AvatarImage src={avatarUrl} alt={userName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">{userName}</div>
                  <div className="text-xs text-muted-foreground">{userRole}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">{userName}</span>
                <span className="text-xs font-normal text-muted-foreground truncate">
                  {userEmail || user?.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                onClick={() => logout("/students")}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
