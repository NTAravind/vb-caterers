import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Lead Dashboard",
  description: "Captured leads from the VB Caterers website.",
  robots: { index: false, follow: false },
};

/**
 * Server component on purpose: it only exports metadata and renders client
 * components, so nothing here reads search params or headers. Access control
 * happens in proxy.ts (page) and lib/admin/guard.ts (the JSON endpoints).
 */
export default function AdminPage() {
  return (
    <AdminShell
      section="leads"
      icon="users"
      title="Captured Leads"
      description="Phone and email details submitted through the welcome gate."
    >
      <AdminDashboard />
    </AdminShell>
  );
}
