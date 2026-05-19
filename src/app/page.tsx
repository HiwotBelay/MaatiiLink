import Link from "next/link";
import {
  Activity,
  ArrowRight,
  FileCheck2,
  LayoutDashboard,
  Megaphone,
  TicketCheck,
} from "lucide-react";
import { MaatiiLinkLogo } from "@/components/brand/MaatiiLinkLogo";
import { HomeHero } from "@/components/landing/HomeHero";
import { VenomBeamBackground } from "@/components/layout/VenomBeamBackground";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { getServerSession } from "@/lib/auth/server";
import { defaultRouteForRole } from "@/lib/rbac";

const modules = [
  { title: "EOD", icon: FileCheck2 },
  { title: "Incidents", icon: Activity },
  { title: "Directives", icon: Megaphone },
  { title: "Service desk", icon: TicketCheck },
];

export default async function HomePage() {
  const session = await getServerSession();
  const workspaceHref = session ? defaultRouteForRole(session.role) : "/login";

  return (
    <VenomBeamBackground>
      <div className="landing-minimal landing-on-beam">
        <header className="landing-header landing-header-beam">
          <MaatiiLinkLogo height={40} priority />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {session ? (
              <Link
                href={workspaceHref}
                className="btn-primary px-4 py-2 text-sm"
              >
                <LayoutDashboard className="h-4 w-4" />
                Open workspace
              </Link>
            ) : (
              <Link href="/login" className="btn-primary px-4 py-2 text-sm">
                Sign in
              </Link>
            )}
          </div>
        </header>

        <main className="landing-main landing-main-wide reveal-up">
          <p className="page-kicker">Cooperative Bank of Oromia</p>
          <HomeHero />
          <ul className="landing-modules">
            {modules.map((m) => (
              <li key={m.title} className="landing-module-chip">
                <m.icon className="h-4 w-4 text-[var(--primary)]" />
                {m.title}
              </li>
            ))}
          </ul>
          <div className="landing-actions">
            {session ? (
              <>
                <Link
                  href={workspaceHref}
                  className="btn-primary px-6 py-3 text-sm"
                >
                  Continue to workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="w-full text-sm text-[var(--muted-foreground)]">
                  Signed in as <strong>{session.name}</strong>
                </p>
              </>
            ) : (
              <Link href="/signup" className="btn-secondary px-6 py-3 text-sm">
                Request access
              </Link>
            )}
          </div>
        </main>
      </div>
    </VenomBeamBackground>
  );
}
