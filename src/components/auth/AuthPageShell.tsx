"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { MaatiiLinkLogo } from "@/components/brand/MaatiiLinkLogo";
import { VenomBeamBackground } from "@/components/layout/VenomBeamBackground";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type Props = {
  children: React.ReactNode;
  badge?: string;
};

export function AuthPageShell({ children, badge }: Props) {
  return (
    <VenomBeamBackground>
      <div className="auth-page auth-on-beam">
        <header className="auth-page-header">
          <Link href="/" className="auth-logo-link">
            <MaatiiLinkLogo height={38} />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="auth-back-home">
              <Home className="h-4 w-4" />
              Back to home
            </Link>
            {badge ? <span className="auth-header-badge">{badge}</span> : null}
            <ThemeToggle />
          </div>
        </header>
        <main className="auth-page-main reveal-up">{children}</main>
      </div>
    </VenomBeamBackground>
  );
}

export function AuthGlowCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`auth-glow-card ${className}`}>
      <div className="auth-glow-card-border" aria-hidden />
      <div className="auth-glow-card-inner">{children}</div>
    </div>
  );
}
