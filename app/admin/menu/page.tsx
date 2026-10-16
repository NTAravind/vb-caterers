import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { MenuEditor } from "@/components/admin/MenuEditor";

export const metadata: Metadata = {
  title: "Menu Editor",
  description: "Edit the VB Caterers menu.",
  robots: { index: false, follow: false },
};

/**
 * Server component that only exports metadata and renders the client editor.
 * Access control happens in proxy.ts (page) and lib/admin/guard.ts (the
 * endpoint the editor talks to).
 */
export default function AdminMenuPage() {
  return (
    <AdminShell
      section="menu"
      icon="menu"
      title="Menu Editor"
      description="Edits the menu in Supabase. Saves publish straight to the live menu page."
    >
      <MenuEditor />
    </AdminShell>
  );
}
