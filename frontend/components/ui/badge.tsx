import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-[4px] border px-2 py-0.5 text-xs font-normal w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[#edf4fc] text-[#0F386C] border-[#b8d4f6] dark:bg-[#0f2238] dark:text-[#5a9be6] dark:border-[#1e3f66]",
        secondary:
          "bg-[#fafafa] text-[#595959] border-[#d9d9d9] dark:bg-[#1f1f1f] dark:text-[#8c8c8c] dark:border-[#303030]",
        destructive:
          "bg-[#fff2f0] text-[#ff4d4f] border-[#ffccc7] dark:bg-[#2a1215] dark:text-[#e84749] dark:border-[#58181c]",
        outline:
          "text-foreground border-border bg-transparent",
        success:
          "bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f] dark:bg-[#162312] dark:text-[#49aa19] dark:border-[#274916]",
        approve:
          "bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f] dark:bg-[#162312] dark:text-[#49aa19] dark:border-[#274916]",
        warning:
          "bg-[#fffbe6] text-[#faad14] border-[#ffe58f] dark:bg-[#2b2111] dark:text-[#d89614] dark:border-[#594214]",
        reject:
          "bg-[#fff2f0] text-[#ff4d4f] border-[#ffccc7] dark:bg-[#2a1215] dark:text-[#e84749] dark:border-[#58181c]",
        info:
          "bg-[#edf4fc] text-[#0F386C] border-[#b8d4f6] dark:bg-[#0f2238] dark:text-[#5a9be6] dark:border-[#1e3f66]",
        draft:
          "bg-[#fafafa] text-[#8c8c8c] border-[#d9d9d9] dark:bg-[#1f1f1f] dark:text-[#8c8c8c] dark:border-[#303030]",
        engineering:
          "bg-[#edf4fc] text-[#0F386C] border-[#b8d4f6] dark:bg-[#0f2238] dark:text-[#5a9be6] dark:border-[#1e3f66]",
        architecture:
          "bg-[#fffbe6] text-[#d48806] border-[#ffe58f] dark:bg-[#2b2111] dark:text-[#d89614] dark:border-[#594214]",
        business:
          "bg-[#f6ffed] text-[#389e0d] border-[#b7eb8f] dark:bg-[#162312] dark:text-[#49aa19] dark:border-[#274916]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
