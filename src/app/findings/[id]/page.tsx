import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SeverityBadge } from "@/components/dashboard/severity-badge";
import { requireInstallation } from "@/lib/auth/require-installation";
import { getStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function FindingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { installationId, accountLogin } = await requireInstallation(
    `/findings/${id}`,
  );

  const finding = await getStore().getFinding(id);
  if (!finding) {
    notFound();
  }

  const repositories = await getStore().listRepositories(installationId);
  const allowed = repositories.some((repo) => repo.id === finding.repositoryId);
  if (!allowed) {
    notFound();
  }

  return (
    <DashboardShell accountLogin={accountLogin}>
      <div className="space-y-8">
        <div>
          <Link
            href="/findings"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "mb-4 -ml-2",
            )}
          >
            ← Back to findings
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {finding.secretType}
            </h1>
            <SeverityBadge severity={finding.severity} />
          </div>
          <p className="mt-1 text-muted-foreground">
            Fingerprint <span className="font-mono text-xs">{finding.fingerprint.slice(0, 16)}…</span>
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Repository:</span>{" "}
                <Link
                  href={`/repositories/${finding.repositoryId}`}
                  className="font-medium hover:underline"
                >
                  {finding.repositoryFullName}
                </Link>
              </p>
              <p>
                <span className="text-muted-foreground">File:</span>{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {finding.filePath}
                </code>
              </p>
              <p>
                <span className="text-muted-foreground">Line:</span>{" "}
                {finding.line}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Confidence:</span>{" "}
                {Math.round(finding.confidence * 100)}%
              </p>
              <p>
                <span className="text-muted-foreground">Detected:</span>{" "}
                {new Date(finding.createdAt).toLocaleString()}
              </p>
              {finding.scanId ? (
                <p>
                  <span className="text-muted-foreground">Scan ID:</span>{" "}
                  <code className="text-xs">{finding.scanId}</code>
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Masked value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-lg">{finding.maskedValue}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              RepoGuardX never stores or displays the full secret. Only a stable
              fingerprint and masked preview are retained.
            </p>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/repositories/${finding.repositoryId}`}
            className={cn(buttonVariants({ variant: "default" }))}
          >
            View repository
          </Link>
          <Link
            href={`/findings?repository=${finding.repositoryId}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            All findings in repo
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
