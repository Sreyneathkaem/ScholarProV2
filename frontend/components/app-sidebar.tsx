"use client";

import * as React from "react";
import Link from "next/link";
import {
  Settings,
  ChartColumnBig,
  GraduationCap,
  CalendarCheck,
  Users,
  ChevronDown,
  ChevronRight,
  Award,
  Mail,
  Boxes,
  FileText,
  User,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

import Image from "next/image";
import { usePathname } from "next/navigation";

type MenuItem = {
  title: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
  roles: string[];
  items?: { title: string; url: string; roles: string[] }[];
};

const navMain: MenuItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: ChartColumnBig,
    roles: ["admin"],
  },
  {
    title: "Applicant",
    url: "/applicant",
    icon: GraduationCap,
    roles: ["admin", "committee"],
  },
  {
    title: "Score",
    url: "/score",
    icon: Award,
    roles: ["committee"],
  },

  {
    title: "Interview",
    url: "/interview",
    icon: CalendarCheck,
    roles: ["committee"],
  },
  {
    title: "Schedule",
    url: "/schedule",
    icon: CalendarCheck,
    roles: ["admin"],
  },

  {
    title: "Send Email",
    url: "/communications",
    icon: Mail,
    roles: ["admin"],
  },

  {
    title: "Batch Management",
    url: "/batch",
    icon: Boxes,
    roles: ["admin"],
  },
  {
    title: "User Management",
    url: "#",
    icon: Users,
    roles: ["admin"],
    items: [
      { title: "Admin", url: "/user-management/admin", roles: ["admin"] },
      {
        title: "Committee",
        url: "/user-management/commitee",
        roles: ["admin"],
      },
    ],
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
    roles: ["admin"],
    items: [
      { title: "Email Management", url: "/setting/email", roles: ["admin"] },
      { title: "Evaluation", url: "/setting/evaluation", roles: ["admin"] },
    ],
  },
  // Student Portal Menu Items
  {
    title: "Registration",
    url: "/students/application",
    icon: FileText,
    roles: ["student"],
  },
  {
    title: "Exam & Schedule",
    url: "/students/exam",
    icon: CalendarCheck,
    roles: ["student"],
  },
  {
    title: "Results",
    url: "/students/grade",
    icon: GraduationCap,
    roles: ["student"],
  },
  {
    title: "Profile",
    url: "/students/profile",
    icon: User,
    roles: ["student"],
  },
];

export function AppSidebar({
  role = "committee",
  ...props
}: {
  role?: string;
} & React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const [openItem, setOpenItem] = React.useState<string | null>(() => {
    // Initialize open state if current pathname matches a sub item
    const matched = navMain.find((item) =>
      item.items?.some(
        (sub) => pathname === sub.url || pathname.startsWith(sub.url + "/"),
      ),
    );
    return matched ? matched.title : null;
  });

  React.useEffect(() => {
    const matched = navMain.find((item) =>
      item.items?.some(
        (sub) => pathname === sub.url || pathname.startsWith(sub.url + "/"),
      ),
    );
    if (matched) {
      setOpenItem(matched.title);
    }
  }, [pathname]);

  const handleToggle = (title: string) => {
    setOpenItem(openItem === title ? null : title);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/80 bg-sidebar" {...props}>
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="justify-center h-16 p-1">
              <Image
                src="/images/logo.svg"
                alt="ScholarPro Logo"
                width={120}
                height={120}
                priority
                loading="eager"
                className="w-full h-full object-contain"
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-2 py-3">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navMain
                .filter((item) => item.roles.includes(role)) // 🔥 filter by role
                .map((item) => {
                  const hasSub = item.items && item.items.length > 0;

                  const isActive =
                    pathname === item.url ||
                    pathname.startsWith(item.url + "/") ||
                    (hasSub &&
                      item.items?.some(
                        (sub) =>
                          pathname === sub.url ||
                          pathname.startsWith(sub.url + "/"),
                      ));

                  const isOpen = openItem === item.title;

                  return (
                    <SidebarMenuItem key={item.title}>
                      {hasSub ? (
                        <SidebarMenuButton
                          onClick={() => handleToggle(item.title)}
                          tooltip={item.title}
                          className={`flex items-center justify-between w-full h-10 px-3 rounded-[6px] text-sm transition-colors ${
                            isActive
                              ? "bg-[#edf4fc] text-[#0F386C] font-medium dark:bg-[#0f2238] dark:text-[#5a9be6]"
                              : "text-foreground/80 hover:bg-accent/60 hover:text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {!!item.icon && <item.icon className="size-4 shrink-0" />}
                            <span>{item.title}</span>
                          </div>

                          {isOpen ? (
                            <ChevronDown className="size-3.5 opacity-60" />
                          ) : (
                            <ChevronRight className="size-3.5 opacity-60" />
                          )}
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton
                          asChild
                          tooltip={item.title}
                          className={`h-10 px-3 rounded-[6px] text-sm transition-colors ${
                            isActive
                              ? "bg-[#edf4fc] text-[#0F386C] font-medium dark:bg-[#0f2238] dark:text-[#5a9be6]"
                              : "text-foreground/80 hover:bg-accent/60 hover:text-foreground"
                          }`}
                        >
                          <Link href={item.url} className="flex items-center gap-2.5">
                            {!!item.icon && <item.icon className="size-4 shrink-0" />}
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      )}

                      {/* Submenu */}
                      {hasSub && isOpen && (
                        <div className="ml-5 my-1 pl-3 border-l border-border/80 space-y-1">
                          {item.items
                            ?.filter((sub) => sub.roles.includes(role))
                            .map((sub) => {
                              const isSubActive = pathname === sub.url;

                              return (
                                <Link
                                  key={sub.title}
                                  href={sub.url}
                                  className={`block px-3 py-1.5 rounded-[4px] text-xs transition-colors ${
                                    isSubActive
                                      ? "bg-[#edf4fc] text-[#0F386C] font-medium dark:bg-[#0f2238] dark:text-[#5a9be6]"
                                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                                  }`}
                                >
                                  {sub.title}
                                </Link>
                              );
                            })}
                        </div>
                      )}
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
