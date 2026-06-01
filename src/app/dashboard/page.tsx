import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
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
import { SecurityScore } from "@/components/dashboard/security-score";
import { SeverityBadge } from "@/components/dashboard/severity-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { requireInstallation } from "@/lib/auth/require-installation";
import {
  getDashboardStats,
  getRepositoriesWithStats,
} from "@/lib/dashboard/stats";
import { getInstallation } from "@/lib/github/installation";
import { getStore } from "@/lib/store";
import type { Severity } from "@/lib/store/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) {
    return "Never";
  }
  return new Date(value).toLocaleString();
}

export default async function DashboardPage() {
  const { installationId, accountLogin } = await requireInstallation("/dashboard");
  const installation = await getInstallation(installationId);
  const stats = await getDashboardStats(installationId);
  const repositories = await getRepositoriesWithStats(installationId);
  const recentFindings = await getStore().listFindings({
    githubInstallationId: installationId,
    limit: 8,
  });
  const recentScans = await getStore().listScans({
    githubInstallationId: installationId,
    limit: 8,
  });

  if (!installation) {
    notFound();
  }

  return (
    <DashboardShell accountLogin={accountLogin}>
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge variant="secondary" className="mb-2">
              Protected repositories
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Security overview for {installation.account.login}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {installation.account.avatarUrl ? (
              <Image
                src={installation.account.avatarUrl}
                alt=""
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : null}
            <div className="text-sm">
              <p className="font-medium">{installation.account.login}</p>
              <p className="text-muted-foreground">{installation.account.type}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard title="Repositories" value={stats.repositories} />
          <StatCard title="Total scans" value={stats.totalScans} />
          <StatCard
            title="Total findings"
            value={stats.totalFindings}
            href="/findings"
          />
          <StatCard
            title="Critical findings"
            value={stats.criticalFindings}
            href="/findings?severity=Critical"
            tone="danger"
          />
          <Card className="flex flex-col justify-center p-6">
            <p className="text-sm text-muted-foreground">Security score</p>
            <SecurityScore score={stats.averageSecurityScore} showBar />
          </Card>
          <Card className="p-6">
            <p className="mb-3 text-sm font-medium">Severity breakdown</p>
            <ul className="space-y-1 text-sm">
              {(
                Object.entries(stats.severityBreakdown) as Array<
                  [Severity, number]
                >
              ).map(([level, count]) => (
                <li key={level} className="flex items-center justify-between">
                  <SeverityBadge severity={level} />
                  <span className="tabular-nums">{count}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Repositories</CardTitle>
            <Badge variant="secondary">{repositories.length}</Badge>
          </CardHeader>
          <CardContent>
            {repositories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No repositories synced yet. Install the app or push a webhook
                event to sync.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Repository</TableHead>
                    <TableHead>Security score</TableHead>
                    <TableHead>Findings</TableHead>
                    <TableHead>Last scan</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repositories.map((repo) => (
                    <TableRow key={repo.id}>
                      <TableCell>
                        <div>
                          <Link
                            href={`/repositories/${repo.id}`}
                            className="font-medium hover:underline"
                          >
                            {repo.fullName}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {repo.private ? "Private" : "Public"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <SecurityScore
                          score={repo.securityScore ?? 100}
                          showBar={false}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="tabular-nums">{repo.findingsCount}</span>
                        {repo.criticalCount > 0 ? (
                          <span className="ml-2 text-xs text-destructive">
                            {repo.criticalCount} critical
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(repo.lastScanAt)}
                        {repo.lastScanStatus ? (
                          <span className="ml-1">· {repo.lastScanStatus}</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/repositories/${repo.id}`}
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

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent findings</CardTitle>
              <Link
                href="/findings"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {recentFindings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No findings yet. Scans run on push, pull request, and install.
                </p>
              ) : (
                <ul className="divide-y divide-border rounded-md border text-sm">
                  {recentFindings.map((finding) => (
                    <li key={finding.id} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/findings/${finding.id}`}
                          className="font-medium hover:underline"
                        >
                          {finding.secretType}
                        </Link>
                        <SeverityBadge severity={finding.severity} />
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        {finding.repositoryFullName} · {finding.filePath}:
                        {finding.line}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent scans</CardTitle>
            </CardHeader>
            <CardContent>
              {recentScans.length === 0 ? (
                <p className="text-sm text-muted-foreground">No scans yet.</p>
              ) : (
                <ul className="divide-y divide-border rounded-md border text-sm">
                  {recentScans.map((scan) => (
                    <li key={scan.id} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">
                          {scan.repositoryFullName}
                        </span>
                        <Badge variant="secondary">{scan.status}</Badge>
                      </div>
                      <p className="text-muted-foreground">
                        {scan.trigger}
                        {scan.ref ? ` · ${scan.ref}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
