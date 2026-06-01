import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  href,
  tone,
  description,
}: {
  title: string;
  value: number | string;
  href?: string;
  tone?: "default" | "danger";
  description?: string;
}) {
  const content = (
    <Card className={cn(href && "transition-colors hover:bg-muted/40")}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "text-3xl font-bold tabular-nums tracking-tight",
            tone === "danger" && "text-destructive",
          )}
        >
          {value}
        </p>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
