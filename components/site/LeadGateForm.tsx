"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LEAD_GATE_COOKIE,
  LEAD_GATE_DONE,
  LEAD_GATE_DONE_MAX_AGE_SECONDS,
  LEAD_GATE_SKIP,
} from "@/lib/lead-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The form on the welcome gate.
 *
 * A visitor either hands over a phone number and an email address, or skips.
 * Either way the choice is written to the gate cookie and they are sent on to
 * the main site. If the details are submitted the row is saved first — a
 * visitor is never told "thank you" for a lead that did not reach Supabase.
 */

type Status = "idle" | "submitting" | "done" | "error";

export function LeadGateForm() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    phoneRef.current?.focus();
  }, []);

  /**
   * Writes the gate cookie and reports whether the browser actually kept it.
   * Browsers with cookies switched off would otherwise bounce the visitor
   * straight back to this page, so the caller falls back to an escape hatch.
   */
  function rememberGate(value: string, persist: boolean): boolean {
    try {
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      const maxAge = persist ? `; Max-Age=${LEAD_GATE_DONE_MAX_AGE_SECONDS}` : "";
      document.cookie = `${LEAD_GATE_COOKIE}=${value}; Path=/; SameSite=Lax${maxAge}${secure}`;
      return document.cookie.includes(`${LEAD_GATE_COOKIE}=${value}`);
    } catch {
      return false;
    }
  }

  /** Hands the visitor to the main site, guarding the cookie-less edge case. */
  function enterSite(value: string, persist: boolean) {
    setStatus("done");
    // Cookies unavailable: let this one request past the gate.
    router.push(rememberGate(value, persist) ? "/" : "/?gate=off");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting" || status === "done") return;

    setStatus("submitting");
    setMessage(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, email }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        setStatus("error");
        setMessage(payload?.message ?? "Something went wrong. Please try again.");
        return;
      }

      // Remembered for a year, and only once the server has confirmed the save.
      enterSite(LEAD_GATE_DONE, true);
    } catch {
      setStatus("error");
      setMessage("Network problem — please check your connection and try again.");
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="lead-phone" className="text-ink-soft">
            Phone number
          </Label>
          <Input
            ref={phoneRef}
            id="lead-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+91 90000 00000"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="lead-email" className="text-ink-soft">
            Email address
          </Label>
          <Input
            id="lead-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
      </div>

      {message ? (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={status !== "idle"}>
        {status === "submitting"
          ? "Sending…"
          : status === "done"
            ? "Taking you to the site…"
            : "Send my details"}
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="-mt-1 text-ink-soft hover:text-ink"
        disabled={status !== "idle"}
        onClick={() => enterSite(LEAD_GATE_SKIP, false)}
      >
     Go to Site
      </Button>
    </form>
  );
}
