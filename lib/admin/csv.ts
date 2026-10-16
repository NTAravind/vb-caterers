/**
 * CSV export helpers for the admin panel.
 *
 * Every lead's timestamp is rendered in Asia/Kolkata because the catering
 * business and its customers are in India, regardless of where the server
 * runs. Exports carry a UTF-8 BOM and CRLF line endings so Excel opens them
 * correctly, and phone numbers are written as quoted text so spreadsheet
 * software does not eat a leading "+" or leading zeroes.
 */

import type { LeadRow } from "@/lib/leads";

export type ExportField = "phone" | "email" | "all";

const IST_DATE = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const IST_TIME = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/** `{"date":"16/10/2026","time":"14:35:09"}`. */
export function formatIst(iso: string): { date: string; time: string } {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return { date: "", time: "" };
  return { date: IST_DATE.format(parsed), time: IST_TIME.format(parsed) };
}

/** Wraps a cell in double quotes, doubling any embedded quotes. */
function cell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function isExportField(value: string | null): value is ExportField {
  return value === "phone" || value === "email" || value === "all";
}

const HEADERS: Record<ExportField, string[]> = {
  phone: ["Phone"],
  email: ["Email"],
  all: ["Phone", "Email", "Date", "Time"],
};

/** Serialises leads to CSV text (BOM + CRLF) for the requested columns. */
export function leadsToCsv(leads: LeadRow[], field: ExportField): string {
  const lines: string[] = [HEADERS[field].map(cell).join(",")];

  for (const lead of leads) {
    if (field === "phone") {
      lines.push(cell(lead.phone));
    } else if (field === "email") {
      lines.push(cell(lead.email));
    } else {
      const { date, time } = formatIst(lead.created_at);
      lines.push([cell(lead.phone), cell(lead.email), cell(date), cell(time)].join(","));
    }
  }

  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
