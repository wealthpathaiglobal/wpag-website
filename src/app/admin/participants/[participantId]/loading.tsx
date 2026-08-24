export default function ParticipantWorkspaceLoading() {
  return (
    <main
      className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-8"
      aria-busy="true"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/40">
          Participant Workspace
        </p>
        <div className="mt-6 flex items-center gap-3" role="status" aria-live="polite">
          <span
            aria-hidden="true"
            className="size-5 animate-spin rounded-full border-2 border-sky-200/30 border-t-sky-200 motion-reduce:animate-none"
          />
          <p className="text-sm text-white/70">Opening participant…</p>
        </div>
      </div>
    </main>
  );
}
