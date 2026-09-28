"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Calendar, User, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { title: "Registration", url: "/students/application", icon: FileText },
  { title: "Exam & Schedule", url: "/students/exam", icon: Calendar },
  { title: "Results", url: "/students/grade", icon: GraduationCap },
  { title: "Profile", url: "/students/profile", icon: User },
];

export default function ApplicantBottomBar({
  className,
}: {
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden transition-colors",
        className,
      )}
    >
      <div className="max-w-screen-lg mx-auto px-4">
        <div className="flex items-center justify-between py-2">
          <div className="w-8 h-8 relative hidden md:block">
            <Image
              src="/assets/LogoCamtech.png"
              alt="logo"
              fill
              sizes="32px"
              className="object-contain"
            />
          </div>

          <div className="flex w-full justify-around">
            {items.map((it) => {
              const Icon = it.icon;
              const active = pathname?.startsWith(it.url);
              return (
                <Link
                  key={it.url}
                  href={it.url}
                  className="flex flex-col items-center justify-center px-2 py-1 transition-colors"
                >
                  <Icon
                    className={cn(
                      "size-5",
                      active ? "text-primary font-semibold" : "text-muted-foreground",
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs mt-1",
                      active ? "text-primary font-semibold" : "text-muted-foreground",
                    )}
                  >
                    {it.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
