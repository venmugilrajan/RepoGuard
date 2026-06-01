import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function scoreTone(score: number): string {
  if (score >= 80) {
    return "text-emerald-600 dark:text-emerald-400";
  }
  if (score >= 50) {
    return "text-amber-600 dark:text-amber-400";
  }
  return "text-destructive";
}

export function SecurityScore({
  score,
  showBar = true,
  className,
}: {
  score: number;
  showBar?: boolean;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, score));

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn("text-2xl font-bold tabular-nums", scoreTone(clamped))}>
          {clamped}
        </span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
      {showBar ? (
        <Progress value={clamped} className="h-2" />
      ) : null}
    </div>
  );
}
