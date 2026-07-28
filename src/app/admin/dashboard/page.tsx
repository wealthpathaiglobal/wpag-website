import { requireRole } from "@/lib/auth/authorization";
import { getParticipants } from "@/lib/services/admin/admin-participant-service";

export default async function AdminDashboardPage() {
  const staff = await requireRole("administrator");
  const participants = await getParticipants();

  const totalParticipants = participants.length;
  const pendingEnrollment = participants.filter(
    (participant) => participant.lifecycle_status === "pending_enrollment"
  ).length;

  const activeParticipants = participants.filter(
    (participant) => participant.lifecycle_status === "active"
  ).length;

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-white/15 pb-8">
          <p className="text-sm uppercase tracking-[0.25em] text-white/50">
            Wealth Path AI Global
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Admin Dashboard
          </h1>

          <p className="mt-4 text-white/60">
            Participant operations, lifecycle management, and institutional
            oversight.
          </p>
        </header>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-sm text-white/50">Signed in as</p>

          <p className="mt-2 text-lg font-medium">
            {staff.full_name ?? staff.email ?? "Administrator"}
          </p>

          <p className="mt-1 text-sm uppercase tracking-wider text-white/40">
            {staff.role}
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-white/50">Participants</p>

            <p className="mt-3 text-3xl font-semibold">
              {totalParticipants}
            </p>

            <p className="mt-2 text-sm text-white/40">
              Total participants registered in WPAG.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-white/50">Pending Enrollment</p>

            <p className="mt-3 text-3xl font-semibold">
              {pendingEnrollment}
            </p>

            <p className="mt-2 text-sm text-white/40">
              Participants waiting for enrollment.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-white/50">Active Participants</p>

            <p className="mt-3 text-3xl font-semibold">
              {activeParticipants}
            </p>

            <p className="mt-2 text-sm text-white/40">
              Participants currently active in the WPAG system.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}