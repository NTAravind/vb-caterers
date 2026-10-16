/**
 * The welcome gate.
 *
 * Before a visitor reaches the main site they are shown a short form asking for
 * a phone number and an email address. Their choice is remembered in a
 * first-party cookie so the proxy — which decides whether to send a visitor to
 * the gate — and the form — which records the choice — agree on a single value
 * with no client storage in between.
 *
 * This module is deliberately free of browser and Node APIs: proxy.ts imports
 * it, and so does a client component.
 */

export const LEAD_GATE_COOKIE = "vb-lead-gate";

/** The visitor handed over their details — remembered for a year. */
export const LEAD_GATE_DONE = "done";

/** The visitor chose "Skip for now" — remembered for this browser session only. */
export const LEAD_GATE_SKIP = "skip";

export const LEAD_GATE_DONE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** True when the cookie says this visitor has already dealt with the gate. */
export function hasPassedLeadGate(value: string | undefined): boolean {
  return value === LEAD_GATE_DONE || value === LEAD_GATE_SKIP;
}
