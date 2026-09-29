import * as React from "react";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

export function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState<boolean>(defaultOpen);

  return (
    <Collapsible defaultOpen={defaultOpen} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          aria-label={`Toggle ${title}`}
          className="flex items-center justify-between mb-4 cursor-pointer"
        >
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <ChevronRight
            className={`h-4 w-4 transform transition-transform ${open ? "rotate-90" : ""}`}
          />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="grid grid-cols-3 gap-4 text-sm">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function Field({
  label,
  value,
  bold,
  span2,
}: {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
  span2?: boolean;
}) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      <p className={`${bold ? "font-semibold" : ""}`}>{value || "-"}</p>
    </div>
  );
}
