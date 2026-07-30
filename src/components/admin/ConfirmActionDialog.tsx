"use client";

import { useEffect, useRef } from "react";

interface ConfirmActionDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  loading?: boolean;
  destructive?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonRequired?: boolean;
  reasonValue?: string;
  onReasonChange?: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel,
  loading = false,
  destructive = false,
  reasonLabel,
  reasonPlaceholder,
  reasonRequired = false,
  reasonValue = "",
  onReasonChange,
  onCancel,
  onConfirm,
}: ConfirmActionDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  const showReasonField =
    typeof reasonLabel === "string" &&
    typeof onReasonChange === "function";

  const normalizedReason = reasonValue.trim();

  const confirmDisabled =
    loading || (reasonRequired && !normalizedReason);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previouslyFocusedElement =
      document.activeElement as HTMLElement | null;

    dialogRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedElement?.focus();
    };
  }, [loading, onCancel, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onCancel();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lifecycle-dialog-title"
        aria-describedby="lifecycle-dialog-description"
        tabIndex={-1}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-6 shadow-2xl outline-none"
      >
        <h2
          id="lifecycle-dialog-title"
          className="text-xl font-semibold text-white"
        >
          {title}
        </h2>

        <p
          id="lifecycle-dialog-description"
          className="mt-3 text-sm leading-6 text-white/60"
        >
          {description}
        </p>

        {showReasonField ? (
          <div className="mt-6">
            <label
              htmlFor="lifecycle-action-reason"
              className="block text-sm font-medium text-white/80"
            >
              {reasonLabel}

              {reasonRequired ? (
                <span className="ml-1 text-rose-400" aria-hidden="true">
                  *
                </span>
              ) : null}
            </label>

            <textarea
              id="lifecycle-action-reason"
              value={reasonValue}
              onChange={(event) =>
                onReasonChange(event.target.value)
              }
              placeholder={reasonPlaceholder}
              required={reasonRequired}
              disabled={loading}
              rows={4}
              maxLength={1000}
              className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-white/25 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <div className="mt-2 flex items-center justify-between gap-4">
              {reasonRequired ? (
                <p className="text-xs text-white/35">
                  A reason is required for this action.
                </p>
              ) : (
                <span />
              )}

              <p className="text-xs text-white/30">
                {reasonValue.length}/1000
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              destructive
                ? "bg-rose-600 hover:bg-rose-500"
                : "bg-emerald-600 hover:bg-emerald-500"
            }`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}