import React from "react";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

export function PageHero({
  title,
  subtitle,
  actions,
  className,
  sticky = true,
}: PageHeroProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-border/60",
        sticky &&
          "sticky top-14 z-30 bg-background/95 backdrop-blur-md pt-5 pb-3 -mt-6 -mx-6 px-6 transition-all duration-150 shadow-[0_1px_3px_rgba(0,0,0,0.02)]",
        className,
      )}
    >
      <div>
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
