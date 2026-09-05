"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * A shell command the reader is meant to run, not just read.
 *
 * Isolated as a client component so the footer around it stays server-rendered
 * — this button is the only thing down there that needs state.
 *
 * The Clipboard API is not always available: it needs a secure context, and a
 * browser can refuse the permission outright. Swallowing that failure leaves
 * the reader clicking a button that does nothing and says nothing, so the
 * fallback selects the command instead and tells them to press the copy key.
 * Something always happens.
 */
export default function CopyCommand({ command }: { command: string }) {
  const [state, setState] = useState<"idle" | "copied" | "selected">("idle");
  const textRef = useRef<HTMLSpanElement>(null);

  function selectCommand() {
    const node = textRef.current;
    if (!node) return false;
    const range = document.createRange();
    range.selectNodeContents(node);
    const sel = window.getSelection();
    if (!sel) return false;
    sel.removeAllRanges();
    sel.addRange(range);
    return true;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setState("copied");
    } catch {
      // No clipboard access — hand the reader a selection they can copy.
      setState(selectCommand() ? "selected" : "idle");
    }
    setTimeout(() => setState("idle"), 2000);
  }

  const label =
    state === "copied"
      ? "Command copied"
      : state === "selected"
        ? "Command selected — press the copy key"
        : `Copy command: ${command}`;

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={copy}
        // aria-label rather than title: the visible text is the command, and a
        // screen reader needs to know the button copies it rather than runs it.
        aria-label={label}
        className="group inline-flex items-center gap-2 rounded-lg border border-aero-border bg-aero-bg px-2.5 py-1.5 font-mono text-[11px] text-aero-mid transition-colors hover:border-aero-primary/40 hover:text-aero-primary focus-visible:border-aero-primary focus-visible:outline-none"
      >
        <span aria-hidden="true" className="select-none text-aero-stable">
          $
        </span>
        <span ref={textRef}>{command}</span>
        {state === "copied" ? (
          <Check className="h-3 w-3 shrink-0 text-aero-drop" aria-hidden="true" />
        ) : (
          <Copy
            className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
        )}
      </button>
      {/* aria-live rather than only the button's label: a label that changes
          under the reader's own focus is not reliably announced. */}
      <span aria-live="polite" className="text-[11px] text-aero-drop">
        {state === "copied" ? "Copied" : state === "selected" ? "Press ⌘C / Ctrl+C" : ""}
      </span>
    </span>
  );
}
