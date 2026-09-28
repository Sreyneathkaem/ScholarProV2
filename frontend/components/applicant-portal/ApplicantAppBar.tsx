"use client";

import Image from "next/image";
import { Menu, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  getStudentDisplayName,
  getStudentInitials,
} from "@/lib/utils/student-portal";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ApplicantAppBar({ className }: { className?: string }) {
  const { user } = useAuth();
  const [userName, setUserName] = useState<string>("Student");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    const syncUser = () => {
      const name = getStudentDisplayName(user);
      setUserName(name);
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
    <div
      className={cn(
        "lg:hidden fixed top-0 left-0 right-0 z-40 bg-background border-b border-border transition-colors",
        className,
      )}
    >
      <div className="max-w-screen-lg mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 relative">
              <Image
                src="/assets/LogoCamtech.png"
                alt="logo"
                fill
                sizes="32px"
                className="object-contain"
              />
            </div>
            <div className="text-sm font-semibold text-foreground">Admissions</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 inline-flex h-2 w-2 rounded-full bg-destructive" />
          </button>

          <Avatar className="border border-border h-8 w-8">
            <AvatarImage src={avatarUrl} alt={userName} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}
