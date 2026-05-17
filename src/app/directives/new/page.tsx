import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DirectivePublishForm } from "@/components/directive/DirectivePublishForm";
import { getServerSession } from "@/lib/auth/server";
import { hasPermission, Permission, defaultRouteForRole } from "@/lib/rbac";

export default async function NewDirectivePage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  if (!hasPermission(session.role, Permission.DIRECTIVE_PUBLISH)) {
    redirect(defaultRouteForRole(session.role));
  }

  return (
    <AppShell user={session}>
      <div className="mb-6">
        <Link href="/directives" className="text-sm text-[#00529b] hover:underline">
          ← Back to directives
        </Link>
      </div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Publish directive</h1>
      </header>
      <DirectivePublishForm />
    </AppShell>
  );
}
