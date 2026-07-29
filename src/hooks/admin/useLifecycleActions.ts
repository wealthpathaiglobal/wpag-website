"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  executeLifecycleAction,
  LifecycleApiError,
  type ParticipantLifecycleClientAction,
} from "@/lib/api/admin/participant-lifecycle-client";

export type LifecycleAction =
  ParticipantLifecycleClientAction;

export type LifecycleFeedback = {
  type: "success" | "error";
  message: string;
} | null;

interface UseLifecycleActionsOptions {
  participantId: string;
}

interface UseLifecycleActionsResult {
  selectedAction: LifecycleAction | null;
  reason: string;
  loading: boolean;
  feedback: LifecycleFeedback;
  isDialogOpen: boolean;
  setReason: (value: string) => void;
  openAction: (action: LifecycleAction) => void;
  closeDialog: () => void;
  confirmAction: () => Promise<void>;
  clearFeedback: () => void;
}

function getDefaultSuccessMessage(
  action: LifecycleAction
): string {
  switch (action) {
    case "enroll":
      return "Participant enrolled successfully.";

    case "pause":
      return "Participant paused successfully.";

    case "resume":
      return "Participant resumed successfully.";

    case "complete":
      return "Participant completed successfully.";

    case "withdraw":
      return "Participant withdrawn successfully.";

    case "archive":
      return "Participant archived successfully.";
  }
}

export function useLifecycleActions({
  participantId,
}: UseLifecycleActionsOptions): UseLifecycleActionsResult {
  const router = useRouter();

  const [selectedAction, setSelectedAction] =
    useState<LifecycleAction | null>(null);

  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] =
    useState<LifecycleFeedback>(null);

  const isDialogOpen = selectedAction !== null;

  function openAction(action: LifecycleAction) {
    if (loading) {
      return;
    }

    setFeedback(null);
    setReason("");
    setSelectedAction(action);
  }

  function closeDialog() {
    if (loading) {
      return;
    }

    setSelectedAction(null);
    setReason("");
  }

  function clearFeedback() {
    setFeedback(null);
  }

  async function confirmAction() {
    if (!selectedAction || loading) {
      return;
    }

    const normalizedReason = reason.trim();

    if (
      selectedAction === "withdraw" &&
      !normalizedReason
    ) {
      setFeedback({
        type: "error",
        message: "Withdrawal reason is required.",
      });

      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const response = await executeLifecycleAction(
        selectedAction,
        participantId,
        normalizedReason || undefined
      );

      setFeedback({
        type: "success",
        message:
          response.message ??
          getDefaultSuccessMessage(selectedAction),
      });

      setSelectedAction(null);
      setReason("");

      router.refresh();
    } catch (error) {
      const message =
        error instanceof LifecycleApiError
          ? error.message
          : "Unable to complete the lifecycle action.";

      setFeedback({
        type: "error",
        message,
      });
    } finally {
      setLoading(false);
    }
  }

  return {
    selectedAction,
    reason,
    loading,
    feedback,
    isDialogOpen,
    setReason,
    openAction,
    closeDialog,
    confirmAction,
    clearFeedback,
  };
}