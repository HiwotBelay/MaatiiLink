"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";
import { ChevronUp, Home, LogOut, Settings, ShieldCheck } from "lucide-react";
import { roleDisplayName, roleSubtitle, userInitials } from "@/lib/role-labels";

type Props = {
  user: { name: string; email: string; role: Role };
};

export function UserMenu({ user }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  async function logout() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const title = roleDisplayName(user.role);
  const subtitle = roleSubtitle(user.role);
  const initials = userInitials(user.name);

  return (
    <div ref={rootRef} className="user-menu">
      <button
        type="button"
        className={`user-menu-trigger ${open ? "user-menu-trigger-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <span className="user-menu-avatar">{initials}</span>
        <ChevronUp
          className={`user-menu-chevron h-4 w-4 ${open ? "" : "rotate-180"}`}
        />
      </button>

      {open && (
        <div
          className="user-menu-dropdown"
          role="menu"
          aria-label="Account"
        >
          <div className="user-menu-header">
            <span className="user-menu-header-icon">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="user-menu-title">{title}</p>
              <p className="user-menu-subtitle">{subtitle}</p>
            </div>
          </div>

          <div className="user-menu-divider" />

          <Link
            href="/"
            className="user-menu-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <Home className="h-4 w-4" />
            Home
          </Link>

          {user.role === "HO_ADMIN" && (
            <Link
              href="/admin"
              className="user-menu-item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          )}

          <button
            type="button"
            className="user-menu-item user-menu-item-danger"
            role="menuitem"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
