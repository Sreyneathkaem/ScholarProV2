"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FileText,
  Calendar,
  User,
  GraduationCap,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/context/auth-context";
import {
  getStudentDisplayName,
  getStudentInitials,
  getStudentRoleLabel,
} from "@/lib/utils/student-portal";

const items = [
  { title: "Registration", url: "/students/application", icon: FileText },
  { title: "Exam & Schedule", url: "/students/exam", icon: Calendar },
  { title: "Results", url: "/students/grade", icon: GraduationCap },
  { title: "Profile", url: "/students/profile", icon: User },
];

export default function ApplicantSidebar({
  className,
  collapsed = false,
}: {
  className?: string;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [userName, setUserName] = useState<string>("Student");
  const [userRole, setUserRole] = useState<string>("Applicant");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    const syncUser = () => {
      const name = getStudentDisplayName(user);
      const role = getStudentRoleLabel(user?.role);
      setUserName(name);
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
    <aside
      className={cn(
        "hidden lg:fixed lg:flex lg:flex-col lg:inset-y-0 left-0 bg-sidebar border-r border-sidebar-border transition-[width] duration-200 z-30",
        collapsed ? "w-20" : "w-72",
        className,
      )}
    >
      <div className="px-6 border-b border-sidebar-border h-16 flex items-center">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 relative bg-muted rounded-lg overflow-hidden flex items-center justify-center p-1">
            <Image
              src="/assets/LogoCamtech.png"
              alt="Logo"
              width={36}
              height={36}
              className="object-contain"
            />
          </div>
          <div>
            <div className="text-base font-semibold text-sidebar-foreground">
              Admissions
            </div>
            <div className="text-xs text-muted-foreground">Student Portal</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6">
        <ul className="space-y-1.5">
          {items.map((it) => {
            const Icon = it.icon;
            const active = pathname?.startsWith(it.url);
            return (
              <li key={it.url}>
                <Link
                  href={it.url}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200",
                    active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5 shrink-0",
                      active ? "text-primary-foreground" : "text-muted-foreground",
                    )}
                  />
                  <span
                    className={cn("truncate", collapsed ? "hidden" : "block")}
                  >
                    {it.title}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-6 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="border border-sidebar-border h-9 w-9">
            <AvatarImage src={avatarUrl} alt={userName} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className={cn(collapsed ? "hidden" : "block min-w-0")}>
            <div className="text-sm font-medium truncate text-sidebar-foreground">{userName}</div>
            <div className="text-xs text-muted-foreground">{userRole}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
