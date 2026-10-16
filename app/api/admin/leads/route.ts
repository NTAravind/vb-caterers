/**
 * Admin lead list. Returns every lead, newest first, for the data table.
 * Table/configuration problems are reported distinctly so the UI can show
 * the operator a "run the migration" hint instead of a generic failure.
 */

import type { NextRequest } from "next/server";
import { fetchLeads, LeadsError } from "@/lib/leads";
import { json, requireAdmin } from "@/lib/admin/guard";

export async function GET(request: NextRequest): Promise<Response> {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const leads = await fetchLeads();
    return json(200, { ok: true, leads });
  } catch (error) {
    if (error instanceof LeadsError && error.kind === "table_missing") {
      return json(503, { ok: false, error: "table-missing", message: error.message });
    }
    if (error instanceof LeadsError && error.kind === "not_configured") {
      return json(503, { ok: false, error: "not-configured", message: error.message });
    }
    console.error("[admin] failed to load leads:", error);
    return json(500, { ok: false, error: "server-error", message: "Could not load leads." });
  }
}
