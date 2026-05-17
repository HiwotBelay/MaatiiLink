"""Generate MaatiiLink PRD v1.0 PDF."""
from fpdf import FPDF
from fpdf.enums import XPos, YPos
from pathlib import Path

OUTPUT = Path(__file__).parent / "MaatiiLink-PRD-v1.0-SABA-CODERS.pdf"

MARGIN = 22


class PrdPDF(FPDF):
    def footer(self):
        self.set_y(-14)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, f"MaatiiLink PRD v1.0 | SABA CODERS | Page {self.page_no()}", align="C")

    def _x0(self):
        self.set_x(self.l_margin)

    def h1(self, text: str):
        self.ln(2)
        self._x0()
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(0, 82, 155)
        self.multi_cell(self.epw, 7, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_text_color(0, 0, 0)
        self.ln(1)

    def h2(self, text: str):
        self.ln(1)
        self._x0()
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(50, 50, 50)
        self.multi_cell(self.epw, 6, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_text_color(0, 0, 0)

    def p(self, text: str):
        self._x0()
        self.set_font("Helvetica", "", 9)
        self.multi_cell(self.epw, 5, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(0.5)

    def bullet(self, text: str):
        self._x0()
        self.set_font("Helvetica", "", 9)
        self.multi_cell(self.epw, 5, f"- {text}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def req_table(self, rows: list[tuple[str, str, str]]):
        """ID | Requirement | Priority"""
        col_w = [22, self.epw - 22 - 18, 18]
        self._x0()
        self.set_font("Helvetica", "B", 8)
        self.set_fill_color(0, 82, 155)
        self.set_text_color(255, 255, 255)
        for i, h in enumerate(["ID", "Requirement", "Pri"]):
            self.cell(col_w[i], 6, f" {h}", border=1, fill=True)
        self.ln()
        self.set_text_color(0, 0, 0)
        self.set_font("Helvetica", "", 8)
        fill = False
        for rid, req, pri in rows:
            if self.get_y() > self.h - 30:
                self.add_page()
            self._x0()
            if fill:
                self.set_fill_color(245, 248, 252)
            h_row = 6
            x0 = self.l_margin
            y0 = self.get_y()
            self.set_xy(x0, y0)
            self.multi_cell(col_w[0], h_row, f" {rid}", border=1, fill=fill, max_line_height=h_row)
            h1 = self.get_y() - y0
            self.set_xy(x0 + col_w[0], y0)
            self.multi_cell(col_w[1], h_row, f" {req}", border=1, fill=fill, max_line_height=h_row)
            h2 = self.get_y() - y0
            self.set_xy(x0 + col_w[0] + col_w[1], y0)
            self.multi_cell(col_w[2], h_row, f" {pri}", border=1, fill=fill, max_line_height=h_row)
            h3 = self.get_y() - y0
            self.set_y(y0 + max(h1, h2, h3))
            fill = not fill
        self.ln(2)


def build():
    pdf = PrdPDF()
    pdf.set_margins(MARGIN, MARGIN, MARGIN)
    pdf.set_auto_page_break(auto=True, margin=MARGIN)
    w = pdf.epw

    # Cover
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 24)
    pdf.set_text_color(0, 82, 155)
    pdf.ln(35)
    pdf._x0()
    pdf.multi_cell(w, 12, "MaatiiLink", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(60, 60, 60)
    pdf._x0()
    pdf.multi_cell(w, 8, "Product Requirements Document", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 11)
    pdf.ln(6)
    pdf._x0()
    pdf.multi_cell(
        w,
        6,
        "Version 1.0  |  May 2026\n"
        "Team: SABA CODERS\n"
        "Client: Cooperative Bank of Oromia\n"
        "COOP DX Valley, Addis Ababa\n\n"
        "Status: Approved (Phase 1 complete)",
        align="C",
        new_x=XPos.LMARGIN,
        new_y=YPos.NEXT,
    )
    pdf.ln(25)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(120, 120, 120)
    pdf._x0()
    pdf.multi_cell(w, 5, "Confidential - SABA CODERS / Coopbank internal use", align="C")

    pdf.add_page()
    pdf.set_text_color(0, 0, 0)

    # 1 Overview
    pdf.h1("1. Overview")
    pdf.h2("1.1 Purpose")
    pdf.p(
        "MaatiiLink is an internal web platform for Cooperative Bank of Oromia that "
        "connects 753+ branches to Head Office (HO) with structured daily operations "
        "data, incidents, policy acknowledgments, and internal support tickets."
    )
    pdf.h2("1.2 Users")
    pdf.req_table([
        ("Persona", "Role enum", "Location"),
        ("Branch teller / ops", "BRANCH_STAFF", "Branch"),
        ("Branch manager", "BRANCH_MANAGER", "Branch"),
        ("District supervisor", "SUPERVISOR", "Field / HO"),
        ("HO ops / IT / compliance", "HO_ADMIN", "HO"),
        ("Internal audit", "AUDITOR", "HO (read-only)"),
    ])
    pdf.h2("1.3 Success criteria (MVP)")
    pdf.bullet("Branch manager submits EOD same day before cut-off (default 18:00 Addis).")
    pdf.bullet("Supervisor sees all branches in district with on-time % and open incidents.")
    pdf.bullet("HO publishes directive; branch acknowledgment logged with user + timestamp.")
    pdf.bullet("Internal ticket has status + assignee visible to branch and HO.")
    pdf.bullet("Every create/update on business entities writes AuditLog.")

    # 2 Assumptions
    pdf.h1("2. Assumptions (discovery)")
    pdf.p(
        "SABA CODERS documents bank reality from public info and standard branch ops. "
        "Validate with real staff when possible."
    )
    pdf.req_table([
        ("ID", "Assumption", ""),
        ("A1", "EOD uses paper, Excel, or WhatsApp to district office", ""),
        ("A2", "Incidents phoned or messaged ad-hoc", ""),
        ("A3", "HO circulars emailed/printed; no proof every branch read", ""),
        ("A4", "IT/facility requests have no shared ticket number", ""),
        ("A5", "Supervisors oversee 10-40 branches; need one dashboard", ""),
        ("A6", "No customer account data in MaatiiLink v1", ""),
    ])

    # 3 Functional
    pdf.add_page()
    pdf.h1("3. Functional requirements")

    pdf.h2("3.1 Authentication (Sprint 1)")
    pdf.req_table([
        ("AUTH-1", "Email + password login", "P0"),
        ("AUTH-2", "Session cookie, HTTP-only, secure in production", "P0"),
        ("AUTH-3", "Role-based redirect after login", "P0"),
        ("AUTH-4", "Deactivated users cannot login", "P0"),
        ("AUTH-5", "Password change (manager/admin)", "P1"),
    ])

    pdf.h2("3.2 Digital EOD (Sprint 2)")
    pdf.req_table([
        ("EOD-1", "One EOD per branch per calendar day", "P0"),
        ("EOD-2", "Fields: date, cash bands, anomalies, complaints, staffing", "P0"),
        ("EOD-3", "Status: DRAFT -> SUBMITTED -> LOCKED", "P0"),
        ("EOD-4", "Only BRANCH_MANAGER or HO_ADMIN can submit", "P0"),
        ("EOD-5", "History list last 30 days for branch", "P0"),
        ("EOD-6", "Cash bands as ranges (0-50K, 50K-200K, 200K+ ETB)", "P0"),
    ])

    pdf.h2("3.3 Incidents (Sprint 3)")
    pdf.req_table([
        ("INC-1", "Create: category, severity, title, description", "P0"),
        ("INC-2", "Categories: FRAUD, DOWNTIME, CASH, SECURITY, DISPUTE, OTHER", "P0"),
        ("INC-3", "Severity: LOW, MEDIUM, HIGH, CRITICAL", "P0"),
        ("INC-4", "Status: OPEN -> ESCALATED -> RESOLVED -> CLOSED", "P0"),
        ("INC-5", "CRITICAL auto-flags on supervisor dashboard", "P0"),
        ("INC-6", "Attachment upload (max 5MB, pdf/jpg/png)", "P1"),
    ])

    pdf.h2("3.4 HO Directives (Sprint 3)")
    pdf.req_table([
        ("DIR-1", "HO_ADMIN publishes title, body, deadline, isCritical", "P0"),
        ("DIR-2", "All branches see active directives", "P0"),
        ("DIR-3", "Manager acknowledges once per branch per directive", "P0"),
        ("DIR-4", "Critical: optional 3-question quiz", "P1"),
        ("DIR-5", "Overdue acks on supervisor dashboard", "P0"),
    ])

    pdf.add_page()
    pdf.h2("3.5 Service desk (Sprint 4)")
    pdf.req_table([
        ("TKT-1", "Categories: IT, FACILITIES, CASH_LOGISTICS, OTHER", "P0"),
        ("TKT-2", "Priority + status workflow OPEN to CLOSED", "P0"),
        ("TKT-3", "HO_ADMIN assigns assignee", "P0"),
        ("TKT-4", "SLA display by priority (24/48/72/168 hours)", "P1"),
        ("TKT-5", "Branch sees own tickets; HO sees all", "P0"),
    ])

    pdf.h2("3.6 Supervisor dashboard (Sprint 4)")
    pdf.req_table([
        ("DASH-1", "Table: branch, EOD status, incidents, overdue directives", "P0"),
        ("DASH-2", "Filter by district/region", "P1"),
        ("DASH-3", "Export CSV for audit sampling", "P1"),
        ("DASH-4", "AUDITOR: read-only view + audit export", "P0"),
    ])

    pdf.h2("3.7 Audit log (Sprint 1+)")
    pdf.req_table([
        ("AUD-1", "Log LOGIN, LOGOUT, EOD_SUBMIT, INCIDENT, DIRECTIVE_ACK, TICKET", "P0"),
        ("AUD-2", "Fields: userId, action, entityType, entityId, metadata, time", "P0"),
    ])

    # 4 Out of scope
    pdf.h1("4. Out of scope (v1)")
    pdf.bullet("Core banking balances / transfers")
    pdf.bullet("Merchant Nation / merchant data")
    pdf.bullet("Customer PII (account numbers, phone)")
    pdf.bullet("Mobile native apps (responsive web only)")
    pdf.bullet("Offline sync (Phase 7 backlog)")
    pdf.bullet("Amharic / Afaan Oromo UI (Phase 9 backlog)")

    # 5 User stories
    pdf.h1("5. User stories (summary)")
    pdf.p(
        "Branch manager: Submit today's EOD before 6pm so the supervisor does not call on WhatsApp."
    )
    pdf.p(
        "Supervisor: See which branches missed EOD or have CRITICAL incidents the same day."
    )
    pdf.p(
        "HO admin: Publish a compliance circular and see which branches acknowledged before deadline."
    )
    pdf.p(
        "Branch staff: Open an IT ticket when equipment fails so HO IT has a ticket ID."
    )
    pdf.p(
        "Auditor: Export audit logs for a date range without editing any record."
    )

    # 6 Acceptance
    pdf.h1("6. Acceptance criteria (MVP release)")
    pdf.bullet("All P0 requirements implemented and tested on staging.")
    pdf.bullet("npm run build passes; /api/health returns database connected.")
    pdf.bullet("Happy path: EOD submit, incident, directive ack, ticket.")
    pdf.bullet(
        "Security: all /api/* routes check session + role except /api/auth/login and /api/health."
    )

    # 7 Approval
    pdf.h1("7. Approval (Gate G1 - SABA CODERS)")
    pdf.req_table([
        ("Role", "Name", "Date"),
        ("SABA CODERS", "Team", "May 2026"),
    ])
    pdf.p("Status: Approved. Optional Coopbank staff validation before pilot.")

    pdf.output(str(OUTPUT))
    return OUTPUT


if __name__ == "__main__":
    print(f"Created: {build()}")
