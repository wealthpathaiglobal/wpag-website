"use client";

import { useMemo, useState } from "react";

import {
  createAuthenticatedSignOutFlow,
  type SignOutViewState,
} from "@/lib/auth/sign-out-flow";

type AuthenticatedSignOutProps = {
  workspace: "Administration" | "Participant Portal";
  tone: "dark" | "light";
};

const initialState: SignOutViewState = { pending: false, error: null };

export default function AuthenticatedSignOut({
  workspace,
  tone,
}: AuthenticatedSignOutProps) {
  const [state, setState] = useState(initialState);
  const signOut = useMemo(
    () =>
      createAuthenticatedSignOutFlow({
        request: () =>
          fetch("/api/auth/sign-out", {
            method: "POST",
            cache: "no-store",
            credentials: "same-origin",
            headers: { Accept: "application/json" },
          }),
        navigate: (destination) => window.location.replace(destination),
        onStateChange: setState,
      }),
    [],
  );

  const dark = tone === "dark";

  return (
    <div className="mt-4" aria-busy={state.pending}>
      <button
        type="button"
        onClick={() => void signOut()}
        disabled={state.pending}
        aria-disabled={state.pending}
        aria-label={`Sign out of ${workspace}`}
        className={`inline-flex min-h-10 w-full items-center justify-center border px-4 text-xs font-semibold uppercase tracking-[0.14em] transition active:translate-y-px disabled:cursor-wait disabled:opacity-70 ${
          dark
            ? "border-white/25 text-white hover:border-white/50 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            : "border-black/30 text-black hover:border-black hover:bg-black hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
        }`}
      >
        {state.pending ? "Signing out…" : "Sign out"}
      </button>
      <p className="sr-only" role="status" aria-live="polite">
        {state.pending ? `Signing out of ${workspace}.` : ""}
      </p>
      {state.error ? (
        <p
          role="alert"
          aria-live="assertive"
          className={`mt-3 text-xs leading-5 ${dark ? "text-rose-200" : "text-red-700"}`}
        >
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
