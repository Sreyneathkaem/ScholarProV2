"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[6px] text-sm font-normal transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary active:scale-[0.99]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-[#154685] active:bg-[#092850] border border-transparent",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_2px_0_rgba(255,77,79,0.1)] hover:bg-[#ff7875] active:bg-[#d9363e] border border-transparent",
        outline:
          "border border-border bg-card text-foreground shadow-[0_2px_0_rgba(0,0,0,0.02)] hover:border-primary hover:text-primary hover:bg-accent/40 active:border-[#092850] active:text-[#092850]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[#e8e8e8] dark:hover:bg-[#303030]",
        ghost:
          "hover:bg-accent/60 hover:text-primary active:bg-accent",
        link: "text-primary underline-offset-4 hover:underline hover:text-[#154685]",
      },
      size: {
        default: "h-9 px-4 py-1.5 has-[>svg]:px-3",
        sm: "h-7 rounded-[4px] gap-1 px-2.5 text-xs has-[>svg]:px-2",
        lg: "h-10 rounded-[6px] px-5 text-base has-[>svg]:px-3.5",
        icon: "size-9",
        "icon-sm": "size-7 rounded-[4px]",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
