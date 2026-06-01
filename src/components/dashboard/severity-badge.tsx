import { Badge } from "@/components/ui/badge";
import type { Severity } from "@/lib/store/types";
import { cn } from "@/lib/utils";

const STYLES: Record<Severity, string> = {
  Critical: "bg-destructive/15 text-destructive border-destructive/30",
  High: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  Medium: "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30",
  Low: "bg-muted text-muted-foreground border-border",
};

export function SeverityBadge({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(STYLES[severity], className)}>
      {severity}
    </Badge>
  );
}
