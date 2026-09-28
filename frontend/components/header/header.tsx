"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useHeader } from "@/components/header/header-context";
import { useAuth } from "@/lib/context/auth-context";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

interface PageHeaderProps {
  showNotifications?: boolean;
  showProfile?: boolean;
}

export function PageHeader({ showProfile = true }: PageHeaderProps) {
  const { title } = useHeader();
  const { actions } = useHeader();
  const { user, logout } = useAuth();
  const router = useRouter();

  const isStudent = user?.role === "student";

  const initials =
    user?.name
      ?.split(" ")
      ?.map((w) => w[0])
      ?.slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  const handleLogout = async () => {
    try {
      await logout(isStudent ? "/students/login" : "/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleProfileClick = () => {
    router.push(isStudent ? "/students/profile" : "/setting/profile");
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/80 bg-card/95 backdrop-blur-md px-4 shadow-[0_1px_4px_rgba(0,21,41,0.04)] transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <SidebarTrigger className="-ml-1 h-8 w-8 rounded-[4px] text-muted-foreground hover:text-foreground hover:bg-accent/60" />
        <div className="h-4 w-px bg-border/80 hidden sm:block" />
        <h1 className="text-base font-semibold truncate text-foreground tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-2.5 min-w-0">
        {/* Page-specific actions injected by pages via header context */}
        {actions}

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Profile Dropdown */}
        {showProfile && user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 px-2 rounded-[6px] flex items-center gap-2.5 min-w-0 hover:bg-accent/60"
              >
                <Avatar className="h-7 w-7 border border-border/80">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium leading-none truncate max-w-[140px] text-foreground">
                      {user.name}
                    </span>
                    <span className="text-[10px] leading-tight px-1.5 py-0.2 rounded-[2px] bg-[#edf4fc] text-[#0F386C] border border-[#b8d4f6] dark:bg-[#0f2238] dark:text-[#5a9be6] dark:border-[#1e3f66] capitalize font-normal">
                      {user.role}
                    </span>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-[6px] border border-border/80 shadow-[0_6px_16px_0_rgba(0,0,0,0.08)]">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    Role: {user.role}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer rounded-[4px]">
                Profile
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-[4px]">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
