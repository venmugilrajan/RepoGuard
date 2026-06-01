import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InstallButton } from "@/components/install-button";
import { SiteHeader } from "@/components/site-header";

const ERROR_MESSAGES: Record<string, string> = {
  missing_installation: "GitHub did not return an installation id.",
  invalid_installation: "The installation id from GitHub was invalid.",
  installation_suspended: "This installation is suspended on GitHub.",
  installation_verify_failed:
    "We could not verify the installation with GitHub.",
};

type HomePageProps = {
  searchParams: Promise<{
    error?: string;
    notice?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const errorMessage = params.error
    ? (ERROR_MESSAGES[params.error] ?? "Installation failed.")
    : null;
  const noticeMessage =
    params.notice === "install_requested"
      ? "Install request submitted. An organization owner may need to approve it."
      : null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <section className="space-y-6">
          <Badge variant="secondary">Production ready</Badge>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Scan repositories for exposed secrets before attackers do.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            RepoGuardX is a self-hostable GitHub App that detects API keys,
            tokens, private keys, and high-entropy credentials in your code.
            Install the app on your organization to get started.
          </p>
          <div className="flex flex-wrap gap-3">
            <InstallButton size="lg" />
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Open dashboard
            </Link>
          </div>
          {errorMessage ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}
          {noticeMessage ? (
            <p className="rounded-md border border-border bg-muted px-4 py-3 text-sm">
              {noticeMessage}
            </p>
          ) : null}
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>GitHub App JWT</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Authenticates as the app using your private key and issues
              short-lived installation tokens.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Installation flow</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Users install RepoGuardX on orgs or accounts; we verify the
              installation and persist session context.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Repository access</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Lists repositories accessible to the installation via the GitHub
              API (scanner wiring arrives in Phase 4).
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
