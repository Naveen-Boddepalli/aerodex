"use client";

import { AlertTriangle, Inbox } from "lucide-react";
import clsx from "clsx";

/**
 * The three states every data-backed panel needs: loading, failed, and empty.
 *
 * A panel that cannot reach the API says so where the data would have been.
 * The alternative — a spinner that never resolves, or a chart drawn from `[]`
 * that looks like a real flat line — is worse than an error message.
 */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx("animate-pulse rounded-xl bg-aero-badge", className)}
      aria-hidden="true"
    />
  );
}

export function LoadingBlock({ label = "Loading…", rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div className="flex flex-col gap-2" role="status" aria-label={label}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function ErrorBlock({ error, retry }: { error: string; retry?: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-red-800">Could not load this panel</div>
        <div className="mt-0.5 break-words text-xs text-red-700">{error}</div>
        {retry && (
          <button
            onClick={retry}
            className="mt-2 rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-aero-border px-4 py-10 text-center">
      <Inbox className="h-6 w-6 text-aero-muted" />
      <p className="max-w-sm text-sm text-aero-muted">{message}</p>
    </div>
  );
}
