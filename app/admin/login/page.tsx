import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "@/components/admin/LoginForm";
import { Icon } from "@/components/site/icons";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="VB Caterers logo"
            width={72}
            height={88}
            priority
            className="h-auto w-16"
          />
          <p className="mt-3 font-script text-2xl text-gold">VB Caterers</p>
          <h1 className="u-heading mt-1 text-xl text-gold">Admin Access</h1>
          <span className="u-ornament mt-3" aria-hidden="true" />
          <p className="mt-3 text-sm text-ink-soft">
            Sign in to review and export captured leads.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-card p-6 shadow-[var(--shadow)]">
          <div className="mb-4 flex items-center gap-2 text-gold">
            <Icon name="lock" className="size-4" />
            <span className="text-xs font-medium uppercase tracking-[0.16em]">
              Protected area
            </span>
          </div>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
