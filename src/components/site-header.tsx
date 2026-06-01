import Link from "next/link";
import { InstallButton } from "@/components/install-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-semibold tracking-tight">
          RepoGuardX
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Dashboard
          </Link>
          <Link
            href="/findings"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Findings
          </Link>
          <InstallButton size="sm" />
        </nav>
      </div>
    </header>
  );
}
