import Link from "next/link";
import { Home } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { UserMenu } from "./UserMenu";
import { ProductionBanner } from "./ProductionBanner";
import type { Role } from "@prisma/client";

type AppShellProps = {
  user: { name: string; email: string; role: Role };
  branchLabel?: string | null;
  children: React.ReactNode;
};

export function AppShell({ user, branchLabel, children }: AppShellProps) {
  return (
    <div className="app-layout">
      <ProductionBanner />
      <AppSidebar user={user} branchLabel={branchLabel} />
      <div className="app-main">
        <header className="app-topbar">
          <Link href="/" className="app-topbar-home">
            <Home className="h-4 w-4" />
            Home
          </Link>
          <UserMenu user={user} />
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
