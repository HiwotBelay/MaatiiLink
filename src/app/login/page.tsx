import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#00529b]">
          Cooperative Bank of Oromia
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">MaatiiLink</h1>
        <p className="mb-6 text-sm text-slate-500">Sign in to your branch account</p>
        <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-center text-xs text-slate-400">
          <Link href="/" className="hover:text-[#00529b]">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
