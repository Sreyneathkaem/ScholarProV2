import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground text-foreground placeholder:text-muted-foreground/60 selection:bg-primary selection:text-primary-foreground border-border h-9 w-full min-w-0 rounded-[6px] border bg-card px-3 py-1.5 text-sm shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-muted",
        "hover:border-primary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
