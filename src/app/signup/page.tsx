import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { AuthGlowCard, AuthPageShell } from "@/components/auth/AuthPageShell";

const steps = [
  {
    icon: Building2,
    title: "Branch identity",
    text: "Supervisor or HO Admin confirms your branch and role.",
  },
  {
    icon: ClipboardList,
    title: "Admin provisioning",
    text: "HO Admin creates your account with the correct permissions.",
  },
  {
    icon: ShieldCheck,
    title: "Start operating",
    text: "Sign in and access EOD, incidents, directives, and service desk.",
  },
];

const roles = ["Staff", "Manager", "Supervisor", "Auditor", "Admin"];

export default function SignupPage() {
  return (
    <AuthPageShell badge="">
      <AuthGlowCard className="auth-glow-card-wide">
        <div className="auth-card-icon auth-card-icon-accent">
          <UserPlus className="h-6 w-6" />
        </div>
        <h1 className="auth-card-title">Request access</h1>
        <p className="auth-card-subtitle">
          MaatiiLink accounts are provisioned by Head Office — not open registration.
        </p>

        <ul className="auth-step-list">
          {steps.map((step, i) => (
            <li key={step.title} className="auth-step-item">
              <span className="auth-step-num">{i + 1}</span>
              <span className="auth-step-icon">
                <step.icon className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="auth-step-title">{step.title}</p>
                <p className="auth-step-text">{step.text}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="auth-info-panel">
          <p className="auth-info-panel-title">
            <Mail className="h-4 w-4" />
            Send your HO Admin
          </p>
          <ul className="auth-checklist">
            <li>Full name and work email</li>
            <li>Branch code or HO department</li>
            <li>Required role (see below)</li>
          </ul>
        </div>

        <div className="auth-role-pills">
          {roles.map((role) => (
            <span key={role} className="auth-role-pill">
              {role}
            </span>
          ))}
        </div>

        <Link href="/login" className="btn-primary auth-glow-btn mt-8 w-full py-3 text-sm">
          Back to sign in
          <ArrowRight className="h-4 w-4" />
        </Link>
      </AuthGlowCard>
    </AuthPageShell>
  );
}
