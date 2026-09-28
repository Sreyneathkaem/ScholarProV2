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
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background/95 backdrop-blur-sm px-4 overflow-x-hidden transition-colors">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <SidebarTrigger className="-ml-1" />
        <h1 className="text-xl font-semibold truncate text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-3 min-w-0">
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
                className="h-10 px-2 rounded-lg flex items-center gap-3 min-w-0 hover:bg-accent"
              >
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start text-left min-w-0">
                  <span className="text-sm font-medium leading-none truncate max-w-[160px] text-foreground">
                    {user.name}
                  </span>
                  <span className="text-xs text-muted-foreground leading-none truncate max-w-[200px]">
                    {user.email}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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
              <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
                Profile
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
