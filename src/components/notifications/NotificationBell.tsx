"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";

type Notification = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    fetch("/api/notifications?limit=15", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => setItems(d.notifications ?? []))
      .catch(() => setItems([]));
  }, [open]);

  const unread = items.filter((n) => !n.readAt).length;

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
  }

  return (
    <div className="notification-bell-wrap">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="notification-bell-btn"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="notification-bell-badge">{unread}</span>}
      </button>
      {open && (
        <div className="notification-dropdown">
          <p className="notification-dropdown-title">In-app alerts</p>
          {items.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)] p-3">No notifications</p>
          ) : (
            <ul className="notification-list">
              {items.map((n) => (
                <li key={n.id} className={n.readAt ? "" : "notification-unread"}>
                  {n.link ? (
                    <Link
                      href={n.link}
                      onClick={() => void markRead(n.id)}
                      className="notification-item"
                    >
                      <strong className="block text-sm">{n.title}</strong>
                      <span className="text-xs opacity-80">{n.body}</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void markRead(n.id)}
                      className="notification-item w-full text-left"
                    >
                      <strong className="block text-sm">{n.title}</strong>
                      <span className="text-xs opacity-80">{n.body}</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="notification-email-hint text-xs p-2 opacity-60">
            Email alerts: configure SMTP + HO_NOTIFY_EMAIL
          </p>
        </div>
      )}
    </div>
  );
}
