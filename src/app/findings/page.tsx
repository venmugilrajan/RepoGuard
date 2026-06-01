import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SeverityBadge } from "@/components/dashboard/severity-badge";
import { requireInstallation } from "@/lib/auth/require-installation";
import { getStore } from "@/lib/store";
import type { Severity } from "@/lib/store/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low"];

type PageProps = {
  searchParams: Promise<{
    severity?: string;
    repository?: string;
  }>;
};

export default async function FindingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { installationId, accountLogin } = await requireInstallation("/findings");

  const severity =
    params.severity && SEVERITIES.includes(params.severity as Severity)
      ? (params.severity as Severity)
      : undefined;

  const findings = await getStore().listFindings({
    githubInstallationId: installationId,
    repositoryId: params.repository,
    severity,
    limit: 100,
  });

  const totalCount = await getStore().countFindings({
    githubInstallationId: installationId,
  });

  function filterHref(next: { severity?: string; repository?: string }) {
    const query = new URLSearchParams();
    const severityValue = next.severity ?? params.severity;
    const repositoryValue = next.repository ?? params.repository;
    if (severityValue) {
      query.set("severity", severityValue);
    }
    if (repositoryValue) {
      query.set("repository", repositoryValue);
    }
    const qs = query.toString();
    return qs ? `/findings?${qs}` : "/findings";
  }

  return (
    <DashboardShell accountLogin={accountLogin}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Findings</h1>
          <p className="mt-1 text-muted-foreground">
            Detected secrets across your installation. Values are masked; raw
            secrets are never stored.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/findings"
            className={cn(
              buttonVariants({
                variant: severity ? "outline" : "default",
                size: "sm",
              }),
            )}
          >
            All
            <Badge variant="secondary" className="ml-2">
              {totalCount}
            </Badge>
          </Link>
          {SEVERITIES.map((level) => (
            <Link
              key={level}
              href={filterHref({ severity: level })}
              className={cn(
                buttonVariants({
                  variant: severity === level ? "default" : "outline",
                  size: "sm",
                }),
              )}
            >
              {level}
            </Link>
          ))}
          {params.repository ? (
            <Badge variant="outline" className="ml-2">
              Repository filter active
            </Badge>
          ) : null}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {severity ? `${severity} findings` : "All findings"}
            </CardTitle>
            <Badge variant="secondary">{findings.length}</Badge>
          </CardHeader>
          <CardContent>
            {findings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No findings match this filter.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Repository</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {findings.map((finding) => (
                    <TableRow key={finding.id}>
                      <TableCell className="font-medium">
                        {finding.secretType}
                      </TableCell>
                      <TableCell>
                        <SeverityBadge severity={finding.severity} />
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/repositories/${finding.repositoryId}`}
                          className="hover:underline"
                        >
                          {finding.repositoryFullName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">
                        {finding.filePath}:{finding.line}
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">
                        {Math.round(finding.confidence * 100)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/findings/${finding.id}`}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "sm" }),
                          )}
                        >
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
