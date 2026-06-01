import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InstallButtonProps = {
  returnTo?: string;
  label?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
};

export function InstallButton({
  returnTo = "/dashboard",
  label = "Install GitHub App",
  variant = "default",
  size = "default",
}: InstallButtonProps) {
  const href = `/api/github/install?return_to=${encodeURIComponent(returnTo)}`;

  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }))}>
      {label}
    </Link>
  );
}
