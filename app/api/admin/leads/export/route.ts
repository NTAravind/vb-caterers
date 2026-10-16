/**
 * CSV export of the collected leads.
 *
 *   ?field=phone  → one column of phone numbers
 *   ?field=email  → one column of email addresses
 *   ?field=all    → phone, email, date, time (Asia/Kolkata)
 */

import type { NextRequest } from "next/server";
import { fetchLeads, LeadsError } from "@/lib/leads";
import { isExportField, leadsToCsv } from "@/lib/admin/csv";
import { json, requireAdmin } from "@/lib/admin/guard";

function filename(field: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `vbcaterers-leads-${field}-${stamp}.csv`;
}

export async function GET(request: NextRequest): Promise<Response> {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const field = request.nextUrl.searchParams.get("field") ?? "all";
  if (!isExportField(field)) {
    return json(400, { ok: false, error: "bad-request", message: "Unknown export field." });
  }

  let leads;
  try {
    leads = await fetchLeads();
  } catch (error) {
    if (error instanceof LeadsError && error.kind === "table_missing") {
      return json(503, { ok: false, error: "table-missing", message: error.message });
    }
    if (error instanceof LeadsError && error.kind === "not_configured") {
      return json(503, { ok: false, error: "not-configured", message: error.message });
    }
    console.error("[admin] failed to export leads:", error);
    return json(500, { ok: false, error: "server-error", message: "Could not export leads." });
  }

  return new Response(leadsToCsv(leads, field), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename(field)}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
