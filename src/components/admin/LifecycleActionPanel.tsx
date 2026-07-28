"use client";

interface LifecycleActionPanelProps {
  lifecycleStatus: string;
}

export default function LifecycleActionPanel({
  lifecycleStatus,
}: LifecycleActionPanelProps) {
  function renderActions() {
    switch (lifecycleStatus) {
      case "pending_enrollment":
        return (
          <button
            type="button"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
          >
            Enroll
          </button>
        );

      case "active":
        return (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-500"
            >
              Pause
            </button>

            <button
              type="button"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
            >
              Complete
            </button>

            <button
              type="button"
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-500"
            >
              Withdraw
            </button>
          </div>
        );

      case "paused":
        return (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
            >
              Resume
            </button>

            <button
              type="button"
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-500"
            >
              Withdraw
            </button>
          </div>
        );

      case "completed":
      case "withdrawn":
        return (
          <button
            type="button"
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600"
          >
            Archive
          </button>
        );

      case "archived":
        return (
          <p className="text-sm text-white/50">
            This participant has been archived. No further lifecycle actions are
            available.
          </p>
        );

      default:
        return (
          <p className="text-sm text-white/40">
            No lifecycle actions are available.
          </p>
        );
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <h2 className="text-lg font-semibold text-white">
        Lifecycle Actions
      </h2>

      <p className="mt-2 text-sm text-white/45">
        Available actions are determined by the participant&apos;s current
        lifecycle status.
      </p>

      <div className="mt-6">{renderActions()}</div>
    </section>
  );
}