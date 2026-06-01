import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SecurityScore } from "@/components/dashboard/security-score";
import { SeverityBadge } from "@/components/dashboard/severity-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { requireInstallation } from "@/lib/auth/require-installation";
import { getRepositoryDetail } from "@/lib/dashboard/stats";
import type { Severity } from "@/lib/store/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ scan?: string }>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Never";
  }
  return new Date(value).toLocaleString();
}

export default async function RepositoryPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const { installationId, accountLogin } = await requireInstallation(
    `/repositories/${id}`,
  );
  const detail = await getRepositoryDetail(installationId, id);

  if (!detail) {
    notFound();
  }

  const { repository, findings, scans, findingsCount, criticalCount, severityBreakdown } =
    detail;
  const lastScan = scans[0] ?? null;

  return (
    <DashboardShell accountLogin={accountLogin}>
      <div className="space-y-8">
        <div>
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "mb-4 -ml-2",
            )}
          >
            ← Back to dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            {repository.fullName}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {repository.private ? "Private repository" : "Public repository"}
            {repository.defaultBranch
              ? ` · default branch ${repository.defaultBranch}`
              : ""}
          </p>
          {query.scan === "queued" ? (
            <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
              Scan queued — results will appear shortly.
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Security score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SecurityScore score={repository.securityScore ?? 100} />
            </CardContent>
          </Card>
          <StatCard title="Findings" value={findingsCount} />
          <StatCard
            title="Critical"
            value={criticalCount}
            tone={criticalCount > 0 ? "danger" : "default"}
          />
          <StatCard
            title="Last scan"
            value={lastScan?.status ?? "—"}
            description={formatDate(repository.lastScannedAt ?? lastScan?.updatedAt ?? null)}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Severity breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {(Object.entries(severityBreakdown) as Array<[Severity, number]>).map(
              ([severity, count]) => (
                <div key={severity} className="flex items-center gap-2">
                  <SeverityBadge severity={severity} />
                  <span className="text-sm font-medium tabular-nums">{count}</span>
                </div>
              ),
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Findings</CardTitle>
            <Link
              href={`/findings?repository=${repository.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {findings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No secrets detected in the latest scans.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Masked value</TableHead>
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
                      <TableCell className="text-sm">
                        {finding.filePath}:{finding.line}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {finding.maskedValue}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/findings/${finding.id}`}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "sm" }),
                          )}
                        >
                          Open
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scan history</CardTitle>
          </CardHeader>
          <CardContent>
            {scans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scans recorded.</p>
            ) : (
              <ul className="divide-y divide-border rounded-md border text-sm">
                {scans.map((scan) => (
                  <li
                    key={scan.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{scan.trigger}</p>
                      <p className="text-muted-foreground">
                        {formatDate(scan.updatedAt)}
                        {scan.ref ? ` · ${scan.ref}` : ""}
                      </p>
                    </div>
                    <Badge variant="secondary">{scan.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Separator />

        <div className="flex flex-wrap gap-2">
          <form action={`/api/repositories/${repository.id}/scan`} method="post">
            <button type="submit" className={cn(buttonVariants())}>
              Run scan now
            </button>
          </form>
          {lastScan ? (
            <form action={`/api/scans/${lastScan.id}/run`} method="post">
              <button
                type="submit"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Re-queue last scan
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}
