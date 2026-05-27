import type { Role } from "@prisma/client";
import { isBranchManager, isBranchStaff } from "@/lib/roles/branch-staff";

type Props = {
  role: Role;
  /** Force a variant on mixed pages; omit on dashboard to auto-detect from role. */
  variant?: "staff" | "manager";
};

export function RoleGuideBanner({ role, variant }: Props) {
  const showStaff =
    variant === "staff" || (variant !== "manager" && isBranchStaff(role));
  const showManager =
    variant === "manager" || (variant !== "staff" && isBranchManager(role));

  if (!showStaff && !showManager) return null;

  if (showStaff) {
    return (
      <div className="role-guide-banner role-guide-staff">
        <p className="role-guide-title">Branch staff — your workspace</p>
        <ul className="role-guide-list">
          <li>
            <strong>Knowledge</strong> — find HO procedures by area (cash, ATM, security…) without
            calling Head Office
          </li>
          <li>
            <strong>Incidents</strong> — report fraud, downtime, cash variance at your branch
          </li>
          <li>
            <strong>Service ops</strong> — open IT, facilities, or cash logistics requests
          </li>
          <li>
            <strong>EOD</strong> — view today&apos;s report; your <strong>branch manager</strong>{" "}
            prepares and submits end-of-day
          </li>
        </ul>
        <p className="role-guide-note">
          You cannot submit EOD or acknowledge HO policies — ask your branch manager.
          You can attach photos or PDFs when reporting incidents.
        </p>
      </div>
    );
  }

  return (
    <div className="role-guide-banner role-guide-manager">
      <p className="role-guide-title">Branch manager — your responsibilities</p>
      <ul className="role-guide-list">
        <li>
          <strong>EOD</strong> — complete cash, operations, and risk sections;{" "}
          <strong>submit before cut-off</strong> (Addis Ababa). Staff can only view status.
        </li>
        <li>
          <strong>Knowledge</strong> — <strong>acknowledge mandatory HO policies</strong> on
          behalf of your branch (staff can read but not sign off).
        </li>
        <li>
          <strong>Incidents</strong> — report issues and <strong>update status</strong> as your
          branch resolves them; attach evidence when needed.
        </li>
        <li>
          <strong>Service ops</strong> — open IT, facilities, or cash logistics tickets; HO/IT
          teams handle assignment.
        </li>
      </ul>
      <p className="role-guide-note">
        You are the accountable officer for branch close and HO compliance at this outlet.
      </p>
    </div>
  );
}
