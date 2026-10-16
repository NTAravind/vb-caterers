"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  FlexRender,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Icon } from "@/components/site/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatIst, type ExportField } from "@/lib/admin/csv";
import type { LeadRow } from "@/lib/leads";

/**
 * Admin lead list.
 *
 * The client owns all data fetching: the page itself is a plain server
 * component that only exports metadata, so nothing here touches the async
 * search params / Suspense edges of `cacheComponents`.
 *
 * TanStack Table v9: features are opt-in, so the table registers exactly the
 * three it needs (global search, sorting, pagination) and the row models that
 * implement them. `features` and `columns` live at module scope because the
 * row models are memoised on their identity.
 */

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { text: sortFn_text, datetime: sortFn_datetime },
});

const PAGE_SIZE = 25;

/** Both date and time render one `created_at`; the date column sorts on it. */
const COLUMNS: ColumnDef<typeof features, LeadRow>[] = [
  {
    id: "index",
    header: "#",
    cell: ({ row }) => <span className="tabular-nums text-ink-soft">{row.index + 1}</span>,
  },
  {
    accessorKey: "phone",
    header: "Phone",
    sortFn: "text",
    enableGlobalFilter: true,
    cell: ({ row }) => (
      <a
        href={`tel:${row.original.phone.replace(/[^\d+]/g, "")}`}
        className="text-gold-deep underline-offset-4 hover:underline"
      >
        {row.original.phone}
      </a>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    sortFn: "text",
    cell: ({ row }) => (
      <a
        href={`mailto:${row.original.email}`}
        className="text-gold-deep underline-offset-4 hover:underline"
      >
        {row.original.email}
      </a>
    ),
  },
  {
    accessorFn: (row) => row.created_at,
    id: "date",
    header: "Date",
    sortFn: "datetime",
    cell: ({ row }) => formatIst(row.original.created_at).date || "—",
  },
  {
    id: "time",
    header: "Time",
    cell: ({ row }) => (
      <span className="tabular-nums text-ink-soft">
        {formatIst(row.original.created_at).time || "—"}
      </span>
    ),
  },
  {
    accessorKey: "source",
    header: "Source",
    sortFn: "text",
    cell: ({ row }) => <Badge variant="outline">{row.original.source}</Badge>,
  },
];

type LoadState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "unauthorized" }
  | { status: "unavailable"; message: string }
  | { status: "error" };

const EXPORTS: { field: ExportField; label: string }[] = [
  { field: "phone", label: "Phone numbers" },
  { field: "email", label: "Email addresses" },
  { field: "all", label: "Everything (CSV)" },
];

type LeadsResult = { state: LoadState; leads?: LeadRow[] };

/**
 * Loads the lead list. Deliberately a module-scope function that never touches
 * React state: the effect below only applies the result from a promise
 * callback, which keeps React's `set-state-in-effect` rule happy.
 */
async function requestLeads(): Promise<LeadsResult> {
  try {
    const response = await fetch("/api/admin/leads", { cache: "no-store" });
    if (response.status === 401) return { state: { status: "unauthorized" } };

    const payload = (await response.json().catch(() => null)) as
      | { ok?: boolean; leads?: LeadRow[]; error?: string; message?: string }
      | null;

    if (!response.ok || !payload?.ok) {
      if (response.status === 503) {
        return {
          state: {
            status: "unavailable",
            message: payload?.message ?? "Leads storage is not ready yet.",
          },
        };
      }
      return { state: { status: "error" } };
    }

    return { state: { status: "ready" }, leads: payload.leads ?? [] };
  } catch {
    return { state: { status: "error" } };
  }
}

export function AdminDashboard() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);

  const applyResult = useCallback((result: LeadsResult) => {
    if (result.leads) setLeads(result.leads);
    setState(result.state);
  }, []);

  useEffect(() => {
    let active = true;
    void requestLeads().then((result) => {
      if (active) applyResult(result);
    });
    return () => {
      active = false;
    };
  }, [applyResult]);

  function reload() {
    setState({ status: "loading" });
    void requestLeads().then(applyResult);
  }

  const table = useTable({
    features,
    columns: useMemo(() => COLUMNS, []),
    data: leads,
    state: { globalFilter: query, sorting },
    onGlobalFilterChange: setQuery,
    onSortingChange: setSorting,
    globalFilterFn: "includesString",
    initialState: { pagination: { pageIndex: 0, pageSize: PAGE_SIZE } },
  });

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    router.push("/admin/login");
    router.refresh();
  }

  const total = table.getFilteredRowModel().rows.length;
  const pageIndex = table.state.pagination.pageIndex;

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar ------------------------------------------------------ */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
          />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              table.setPageIndex(0);
            }}
            placeholder="Search phone or email…"
            aria-label="Search leads"
            className="bg-card pl-9 text-ink"
          />
        </div>
        <Button variant="outline" onClick={reload} title="Reload leads">
          <Icon name="refresh" />
          Refresh
        </Button>
        <Button variant="ghost" onClick={() => void handleLogout()} title="Sign out">
          <Icon name="logout" />
          Sign out
        </Button>
      </div>

      {/* Export buttons ------------------------------------------------ */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-ink-soft">Export CSV:</span>
        {EXPORTS.map((option) => (
          <Button key={option.field} variant="secondary" size="sm" asChild>
            <a href={`/api/admin/leads/export?field=${option.field}`} download>
              <Icon name="download" />
              {option.label}
            </a>
          </Button>
        ))}
      </div>

      {/* The table ----------------------------------------------------- */}
      <Card className="border-line bg-card text-ink shadow-[var(--shadow)]">
        <CardHeader className="pb-3">
          <CardTitle className="u-heading flex items-center gap-2 text-lg text-gold">
            <Icon name="users" className="size-5" />
            Captured Leads
          </CardTitle>
          <CardDescription className="text-ink-soft">
            {state.status === "ready"
              ? `${total} ${total === 1 ? "lead" : "leads"} · newest first · times in IST`
              : "Every enquiry sent through the site's welcome gate."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {state.status === "loading" ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-11 w-full bg-gold/10" />
              ))}
            </div>
          ) : state.status === "unauthorized" ? (
            <Alert tone="warn">
              Your session has expired.{" "}
              <Button asChild variant="link" size="sm" className="h-auto p-0">
                <a href="/admin/login">Sign in again</a>
              </Button>
            </Alert>
          ) : state.status === "unavailable" ? (
            <Alert tone="info">
              <span className="flex flex-col gap-1">
                <strong>The leads table has not been created yet.</strong>
                <span>
                  Paste the SQL in{" "}
                  <code className="rounded bg-page px-1 py-0.5 text-xs">
                    supabase/migrations/
                  </code>{" "}
                  into the Supabase SQL Editor, then reload this page.
                </span>
              </span>
            </Alert>
          ) : state.status === "error" ? (
            <Alert tone="warn">
              Could not load leads.{" "}
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={reload}
              >
                Try again
              </Button>
            </Alert>
          ) : total === 0 ? (
            <p className="py-8 text-center text-ink-soft">
              {query
                ? "No leads match your search."
                : "No leads yet — they appear here as soon as a visitor passes the welcome gate."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-line">
                    {headerGroup.headers.map((header) => {
                      const direction = header.column.getIsSorted();
                      const sortable = header.column.getCanSort();
                      return (
                        <TableHead
                          key={header.id}
                          className="text-ink-soft"
                          aria-sort={
                            direction === "asc"
                              ? "ascending"
                              : direction === "desc"
                                ? "descending"
                                : undefined
                          }
                        >
                          {sortable ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="inline-flex items-center gap-1 transition-colors hover:text-gold"
                              title="Sort"
                            >
                              <FlexRender header={header} />
                              <Icon
                                name="chevron"
                                className={`size-3.5 transition-transform ${
                                  direction === "asc"
                                    ? "rotate-180"
                                    : direction === "desc"
                                      ? "rotate-0"
                                      : "opacity-30"
                                }`}
                              />
                            </button>
                          ) : (
                            <FlexRender header={header} />
                          )}
                        </TableHead>
                      );
                    })}
                  </tr>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="border-line hover:bg-muted/40">
                    {row.getAllCells().map((cell) => (
                      <TableCell key={cell.id}>
                        <FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination ----------------------------------------------------- */}
      {state.status === "ready" && total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-soft">
            Page {pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <Icon name="arrow-left" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <Icon name="arrow-right" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Alert({
  tone,
  children,
}: {
  tone: "warn" | "info";
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${
        tone === "warn"
          ? "border-destructive/40 bg-destructive/10 text-ink"
          : "border-gold/40 bg-gold/10 text-ink"
      }`}
    >
      <Icon name="alert" className="mt-0.5 size-4 shrink-0 text-gold" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}
