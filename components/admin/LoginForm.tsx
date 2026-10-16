"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/site/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Admin sign-in form.
 *
 * On success the session cookie is already set by the response, so the client
 * only has to refresh the router tree so proxy.ts re-runs and lets the
 * dashboard through. The `?next=` path written by proxy.ts is read from
 * `window.location` at submit time rather than via `useSearchParams`, which
 * keeps this page free of the Suspense requirement that `useSearchParams`
 * carries under `cacheComponents`.
 */

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  function nextPath(): string {
    if (typeof window === "undefined") return "/admin";
    const target = new URLSearchParams(window.location.search).get("next");
    // Only ever bounce to a same-origin admin path.
    return target && target.startsWith("/admin") ? target : "/admin";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        setError(payload?.message ?? "Sign-in failed. Please try again.");
        setSubmitting(false);
        return;
      }

      router.replace(nextPath());
      router.refresh();
    } catch {
      setError("Network problem — please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-1.5">
        <Label htmlFor="admin-email" className="text-ink-soft">
          Email
        </Label>
        <Input
          ref={emailRef}
          id="admin-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="admin@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="admin-password" className="text-ink-soft">
          Password
        </Label>
        <Input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      {error ? (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={submitting}>
        <Icon name="lock" />
        {submitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
