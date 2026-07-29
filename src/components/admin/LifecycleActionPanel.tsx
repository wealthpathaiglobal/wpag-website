"use client";

import AdminActionButton from "@/components/admin/AdminActionButton";
import ConfirmActionDialog from "@/components/admin/ConfirmActionDialog";
import {
  type LifecycleAction,
  useLifecycleActions,
} from "@/hooks/admin/useLifecycleActions";

interface LifecycleActionPanelProps {
  participantId: string;
  lifecycleStatus: string;
}

type ActionConfiguration = {
  action: LifecycleAction;
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  variant:
    | "primary"
    | "success"
    | "warning"
    | "danger"
    | "secondary";
  destructive?: boolean;
};

const actionConfigurations: Record<
  LifecycleAction,
  ActionConfiguration
> = {
  enroll: {
    action: "enroll",
    label: "Enroll",
    title: "Enroll participant",
    description:
      "This action will enroll the participant and activate their institutional participant lifecycle.",
    confirmLabel: "Confirm Enrollment",
    variant: "success",
  },

  pause: {
    action: "pause",
    label: "Pause",
    title: "Pause participant",
    description:
      "This action will temporarily pause the participant lifecycle. The participant can be resumed later.",
    confirmLabel: "Confirm Pause",
    variant: "warning",
  },

  resume: {
    action: "resume",
    label: "Resume",
    title: "Resume participant",
    description:
      "This action will restore the participant to active lifecycle status.",
    confirmLabel: "Confirm Resume",
    variant: "success",
  },

  complete: {
    action: "complete",
    label: "Complete",
    title: "Complete participant lifecycle",
    description:
      "This action will mark the participant lifecycle as completed. Review all required participant work before continuing.",
    confirmLabel: "Confirm Completion",
    variant: "primary",
  },

  withdraw: {
    action: "withdraw",
    label: "Withdraw",
    title: "Withdraw participant",
    description:
      "This action will withdraw the participant from the programme. A clear institutional reason is required and will be recorded in the lifecycle history.",
    confirmLabel: "Confirm Withdrawal",
    variant: "danger",
    destructive: true,
  },

  archive: {
    action: "archive",
    label: "Archive",
    title: "Archive participant",
    description:
      "This action will archive the participant record. Archived participants become read-only for lifecycle operations.",
    confirmLabel: "Confirm Archive",
    variant: "secondary",
    destructive: true,
  },
};

function getAvailableActions(
  lifecycleStatus: string
): LifecycleAction[] {
  switch (lifecycleStatus) {
    case "pending_enrollment":
      return ["enroll"];

    case "active":
      return ["pause", "complete", "withdraw"];

    case "paused":
      return ["resume", "withdraw"];

    case "completed":
    case "withdrawn":
      return ["archive"];

    default:
      return [];
  }
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function LifecycleActionPanel({
  participantId,
  lifecycleStatus,
}: LifecycleActionPanelProps) {
  const {
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
  } = useLifecycleActions({
    participantId,
  });

  const availableActions =
    getAvailableActions(lifecycleStatus);

  const selectedConfiguration = selectedAction
    ? actionConfigurations[selectedAction]
    : null;

  const isArchived = lifecycleStatus === "archived";

  return (
    <>
      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Lifecycle Actions
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Available actions are determined by the
              participant&apos;s current lifecycle status.
              Every completed transition is recorded in the
              immutable lifecycle history.
            </p>
          </div>

          <div className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/60">
            Current: {formatStatus(lifecycleStatus)}
          </div>
        </div>

        {feedback ? (
          <div
            role={feedback.type === "error" ? "alert" : "status"}
            className={`mt-6 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 ${
              feedback.type === "success"
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                : "border-rose-400/20 bg-rose-400/10 text-rose-200"
            }`}
          >
            <p className="text-sm leading-6">
              {feedback.message}
            </p>

            <button
              type="button"
              onClick={clearFeedback}
              className="shrink-0 text-sm opacity-60 transition-opacity hover:opacity-100"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        ) : null}

        <div className="mt-6">
          {isArchived ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-sm text-white/55">
                This participant has been archived. No further
                lifecycle actions are available.
              </p>
            </div>
          ) : availableActions.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-sm text-white/55">
                No lifecycle actions are available for the
                current status.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {availableActions.map((action) => {
                const configuration =
                  actionConfigurations[action];

                return (
                  <AdminActionButton
                    key={action}
                    label={configuration.label}
                    variant={configuration.variant}
                    loading={
                      loading && selectedAction === action
                    }
                    disabled={loading}
                    onClick={() => openAction(action)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {availableActions.length > 0 ? (
          <p className="mt-5 text-xs leading-5 text-white/30">
            Lifecycle actions require administrator
            confirmation. Withdrawal requires a documented
            reason.
          </p>
        ) : null}
      </section>

      <ConfirmActionDialog
        open={isDialogOpen}
        title={
          selectedConfiguration?.title ??
          "Confirm lifecycle action"
        }
        description={
          selectedConfiguration?.description ??
          "Confirm this lifecycle action."
        }
        confirmLabel={
          selectedConfiguration?.confirmLabel ?? "Confirm"
        }
        loading={loading}
        destructive={
          selectedConfiguration?.destructive ?? false
        }
        reasonLabel={
          selectedAction === "withdraw"
            ? "Withdrawal reason"
            : undefined
        }
        reasonPlaceholder={
          selectedAction === "withdraw"
            ? "Enter the institutional reason for withdrawal..."
            : undefined
        }
        reasonRequired={selectedAction === "withdraw"}
        reasonValue={reason}
        onReasonChange={
          selectedAction === "withdraw"
            ? setReason
            : undefined
        }
        onCancel={closeDialog}
        onConfirm={() => {
          void confirmAction();
        }}
      />
    </>
  );
}