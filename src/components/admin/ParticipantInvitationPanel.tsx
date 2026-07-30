"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { ParticipantLifecycleStatus } from "@/lib/types/participant/participant";

interface Invitation {
  id: string;
  status: string;
  invited_at: string | null;
  expires_at: string |null;
}

interface ParticipantInvitationPanelProps {
  participantId: string;
  authUserId: string | null;
  lifecycleStatus: ParticipantLifecycleStatus;
  invitation: Invitation | null;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);
}

function formatStatus(status: string | null) {
  if (!status) return "Not Invited";

  return status
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function getStatusClasses(status: string | null) {
  switch (status) {
    case "pending":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    case "sent":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";

    case "accepted":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "expired":
      return "border-rose-400/20 bg-rose-400/10 text-rose-300";

    default:
      return "border-white/10 bg-white/[0.04] text-white/70";
  }
}

function getInvitationUnavailableReason(
  authUserId: string | null,
  lifecycleStatus: ParticipantLifecycleStatus,
  invitationStatus: string | null
): string | null {
  if (authUserId) {
    return "This participant already has an authenticated account.";
  }

  if (invitationStatus === "pending") {
    return "An invitation is already pending for this participant.";
  }

  if (invitationStatus === "sent") {
    return "An invitation has already been sent to this participant.";
  }

  if (
    lifecycleStatus === "completed" ||
    lifecycleStatus === "withdrawn" ||
    lifecycleStatus === "archived"
  ) {
    return `Invitations are unavailable for participants whose lifecycle status is ${formatStatus(
      lifecycleStatus
    ).toLowerCase()}.`;
  }

  return null;
}

export default function ParticipantInvitationPanel({
  participantId,
  authUserId,
  lifecycleStatus,
  invitation,
}: ParticipantInvitationPanelProps) {
  const router = useRouter();
  const submissionInProgress = useRef(false);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const invitationUnavailableReason =
    getInvitationUnavailableReason(
      authUserId,
      lifecycleStatus,
      invitation?.status ?? null
    );

  const invitationDisabled =
    loading || invitationUnavailableReason !== null;

  async function sendInvitation() {
    if (invitationDisabled || submissionInProgress.current) return;

    try {
      submissionInProgress.current = true;
      setLoading(true);
      setMessage(null);
      setError(null);

      const response = await fetch(
        "/api/admin/participants/invite",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            participantId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Unable to send participant invitation."
        );
      }

      setMessage(
        "Invitation sent successfully."
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unexpected error occurred."
      );
    } finally {
      submissionInProgress.current = false;
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-white">
          Participant Invitation
        </h2>

        <p className="text-sm leading-6 text-white/45">
          Manage participant onboarding and
          authentication invitations.
        </p>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-white/35">
            Status
          </p>

          <span
            className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(
              invitation?.status ?? null
            )}`}
          >
            {formatStatus(invitation?.status ?? null)}
          </span>
        </div>

        <div>
  <p className="text-xs uppercase tracking-wider text-white/35">
    Invited
  </p>

  <p
    className="mt-2 text-sm text-white"
    suppressHydrationWarning
  >
    {formatDate(invitation?.invited_at ?? null)}
  </p>
</div>

<div>
  <p className="text-xs uppercase tracking-wider text-white/35">
    Expires
  </p>

  <p
    className="mt-2 text-sm text-white"
    suppressHydrationWarning
  >
    {formatDate(invitation?.expires_at ?? null)}
  </p>
</div>
      </div>

      {invitation?.status === "failed" && (
        <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3">
          <p className="text-sm text-amber-200">
            Previous invitation error:
          </p>

          <p className="mt-2 text-sm text-amber-100">
            The previous invitation attempt did not complete
            successfully.
          </p>
        </div>
      )}

      {error && (
        <div
          aria-live="polite"
          className="mt-6 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          aria-live="polite"
          className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
        >
          {message}
        </div>
      )}

      {invitationUnavailableReason ? (
        <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          {invitationUnavailableReason}
        </div>
      ) : null}

      <button
        type="button"
        disabled={invitationDisabled}
        onClick={sendInvitation}
        className="mt-6 rounded-xl bg-white px-5 py-3 font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Sending Invitation..."
          : "Send Invitation"}
      </button>
    </section>
  );
}
