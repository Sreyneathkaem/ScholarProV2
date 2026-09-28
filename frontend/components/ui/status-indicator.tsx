import { Badge } from "@/components/ui/badge";
import { StudentStatus } from "@/types/exam";

interface StatusIndicatorProps {
  status: StudentStatus;
  type?: "badge" | "dot";
}

export function StatusIndicator({ status, type = "badge" }: StatusIndicatorProps) {
  if (type === "dot") {
    if (status === "Exempt") {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Exempt
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
          <span className="h-2 w-2 rounded-full bg-muted-foreground" />
          Required
        </span>
      );
    }
  }

  // Badge type (default)
  return (
    <Badge variant={status === "Exempt" ? "info" : "secondary"}>
      {status}
    </Badge>
  );
}
