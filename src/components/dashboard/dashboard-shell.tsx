import Link from "next/link";
import { InstallButton } from "@/components/install-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/findings", label: "Findings" },
];

export function DashboardShell({
  children,
  accountLogin,
}: {
  children: React.ReactNode;
  accountLogin?: string;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-semibold tracking-tight">
              RepoGuardX
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {accountLogin ? (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {accountLogin}
              </span>
            ) : null}
            <InstallButton size="sm" label="Add installation" variant="outline" />
            <Link
              href="/api/github/signout"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
