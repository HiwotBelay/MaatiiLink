import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { KnowledgePublishForm } from "@/components/directive/KnowledgePublishForm";
import { getServerSession } from "@/lib/auth/server";
import { hasPermission, Permission, defaultRouteForRole } from "@/lib/rbac";

export default async function NewDirectivePage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  if (!hasPermission(session.role, Permission.DIRECTIVE_PUBLISH)) {
    redirect(defaultRouteForRole(session.role));
  }

  return (
    <AppShell user={session} branchLabel={null}>
      <div className="mb-6">
        <Link href="/directives" className="text-sm text-[#00529b] hover:underline">
          ← Back to knowledge center
        </Link>
      </div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Publish procedure</h1>
        <p className="text-slate-500">
          Add to the operational knowledge hub with category, priority, and acknowledgment rules
        </p>
      </header>
      <KnowledgePublishForm />
    </AppShell>
  );
}
