"use client";

import InternalNavigationFeedbackLink from "@/components/navigation/InternalNavigationFeedbackLink";

export default function AdminDashboardReturnLink() {
  return (
    <InternalNavigationFeedbackLink
      href="/admin/dashboard"
      pendingLabel="Returning to Admin Dashboard…"
      errorLabel="Admin Dashboard could not be opened. Try again."
      instrumentationName="admin-dashboard-return"
      className={(phase) => `inline-flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm transition-[color,background-color,border-color,box-shadow] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 ${
        phase === "pressed" || phase === "loading"
          ? "border-sky-300/50 bg-sky-400/20 text-sky-100 shadow-[0_0_0_1px_rgba(125,211,252,0.12)]"
          : phase === "error"
            ? "border-rose-300/35 bg-rose-400/10 text-rose-100 hover:bg-rose-400/15"
            : "border-transparent text-white/55 hover:border-white/15 hover:bg-white/5 hover:text-white"
      } ${phase === "loading" ? "cursor-wait" : ""}`}
    >
      <span aria-hidden="true">←</span>
      <span>Back to Admin Dashboard</span>
    </InternalNavigationFeedbackLink>
  );
}
