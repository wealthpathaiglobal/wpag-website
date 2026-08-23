import type {
  ParticipantLifecycleStatus,
  ParticipantResearchStatus,
} from "@/lib/types/participant/participant";

export type ParticipantDashboardPolicyInput = {
  lifecycleStatus: ParticipantLifecycleStatus;
  researchStatus: ParticipantResearchStatus;
  profileCompleted: boolean;
  consentStatus: string;
  consentGate: string;
  privacyGate: string;
  wave1Gate: string;
  fshOutputStatus: string;
  softLaunchReleaseGate: string;
  consentActionAvailable: boolean;
  reportAvailable: boolean;
  evidenceStatus: string;
};

export type ParticipantDashboardControl = {
  id: string;
  number: string;
  title: string;
  description: string;
  status: string;
  buttonLabel: string;
  href: string | null;
  available: boolean;
  mode: "read_only" | "contains_writes" | "unavailable";
  notice: string;
};

export type ParticipantDashboardJourneyStage = {
  title: string;
  status: string;
  complete: boolean;
};

function label(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getParticipantDashboardPolicy(
  input: ParticipantDashboardPolicyInput,
) {
  const active = input.lifecycleStatus === "active";
  const profileAvailable = ["pending_enrollment", "active"].includes(
    input.lifecycleStatus,
  );

  const controls: ParticipantDashboardControl[] = [
    {
      id: "research",
      number: "00",
      title: "Research participation",
      description:
        "View factual research, consent, privacy, FSH-output, and release status.",
      status: `Consent ${label(input.consentStatus)} · Privacy ${label(input.privacyGate)}`,
      buttonLabel: "Open Research Status",
      href: "/participant/research-participation",
      available: true,
      mode: "contains_writes",
      notice: input.consentActionAvailable
        ? "A governed consent decision is available on the destination page."
        : "Consent and withdrawal actions are unavailable. The governed questions and complaints intake remains a write action.",
    },
    {
      id: "profile",
      number: "01",
      title: "Participant profile",
      description: "View the participant profile associated with this account.",
      status: input.profileCompleted ? "Profile complete" : "Profile incomplete",
      buttonLabel: profileAvailable ? "View Profile" : "Profile Unavailable",
      href: profileAvailable ? "/participant/profile" : null,
      available: profileAvailable,
      mode: profileAvailable ? "contains_writes" : "unavailable",
      notice: profileAvailable
        ? "Viewing is available. Saving or completing the profile changes stored participant data."
        : "Profile access is unavailable for the current lifecycle.",
    },
    {
      id: "assessment",
      number: "02",
      title: "HFOS assessment",
      description:
        "Access the governed, non-diagnostic participant assessment when lifecycle authority permits.",
      status: active ? "Available for active lifecycle" : "Requires active lifecycle",
      buttonLabel: active ? "Open Assessment" : "Assessment Unavailable",
      href: active ? "/participant/assessment" : null,
      available: active,
      mode: active ? "contains_writes" : "unavailable",
      notice: active
        ? "Starting or editing an assessment writes participant-provided assessment data."
        : "Assessment access remains blocked by the current participant lifecycle.",
    },
    {
      id: "evidence",
      number: "03",
      title: "Evidence submissions",
      description:
        "Access governed private evidence only when lifecycle and assessment context permit.",
      status: active ? input.evidenceStatus : "Requires active lifecycle",
      buttonLabel: active ? "Open Evidence" : "Evidence Unavailable",
      href: active ? "/participant/evidence" : null,
      available: active,
      mode: active ? "contains_writes" : "unavailable",
      notice: active
        ? "Evidence upload creates governed evidence and immutable version records."
        : "Evidence access remains blocked; no upload action is available.",
    },
    {
      id: "tasks",
      number: "04",
      title: "Programme tasks",
      description: "Programme-task functionality is not available in this release.",
      status: "Not available",
      buttonLabel: "Not Yet Available",
      href: null,
      available: false,
      mode: "unavailable",
      notice: "No governed participant-tasks route exists in this release.",
    },
    {
      id: "schedule",
      number: "05",
      title: "Follow-up schedule",
      description: "Participant schedule functionality is not available in this release.",
      status: "Not available",
      buttonLabel: "Not Yet Available",
      href: null,
      available: false,
      mode: "unavailable",
      notice: "No governed participant-schedule route exists in this release.",
    },
    {
      id: "messages",
      number: "06",
      title: "Messages",
      description: "Secure participant messaging is not available in this release.",
      status: "Not available",
      buttonLabel: "Not Yet Available",
      href: null,
      available: false,
      mode: "unavailable",
      notice: "No governed participant-messaging route exists in this release.",
    },
    {
      id: "documents",
      number: "07",
      title: "Documents",
      description: "A general participant-documents area is not available in this release.",
      status: "Not available",
      buttonLabel: "Not Yet Available",
      href: null,
      available: false,
      mode: "unavailable",
      notice: "No governed general participant-documents route exists in this release.",
    },
    {
      id: "reports",
      number: "08",
      title: "Progress and reports",
      description: "View reports released through the governed report lifecycle.",
      status: input.reportAvailable ? "Released report available" : "No released report available",
      buttonLabel: "View Reports",
      href: "/participant/reports",
      available: true,
      mode: "read_only",
      notice: "Only formally released reports are visible. Viewing does not change participant data.",
    },
  ];

  const journey: ParticipantDashboardJourneyStage[] = [
    {
      title: "Participant lifecycle",
      status: label(input.lifecycleStatus),
      complete: ["active", "completed"].includes(input.lifecycleStatus),
    },
    {
      title: "Participant profile",
      status: input.profileCompleted ? "Complete" : "Incomplete",
      complete: input.profileCompleted,
    },
    {
      title: "Research participation",
      status: label(input.researchStatus),
      complete: ["enrolled", "completed"].includes(input.researchStatus),
    },
    {
      title: "Research consent",
      status: `${label(input.consentStatus)} · Gate ${label(input.consentGate)}`,
      complete: input.consentStatus === "GRANTED" && input.consentGate === "OPEN",
    },
    {
      title: "Privacy authority",
      status: label(input.privacyGate),
      complete: input.privacyGate === "OPEN",
    },
    {
      title: "FSH participant output",
      status: label(input.fshOutputStatus),
      complete: false,
    },
    {
      title: "Soft-launch release",
      status: label(input.softLaunchReleaseGate),
      complete: input.softLaunchReleaseGate === "OPEN",
    },
  ];

  return {
    controls,
    journey,
    assessmentAvailable: active,
    enrollmentNotice: active
      ? "Participant lifecycle is active. Writable modules remain subject to their own governed server checks."
      : `Participant lifecycle is ${label(input.lifecycleStatus)}. Enrollment, assessment, and evidence actions remain unavailable.`,
    gateSummary: [
      ["Participant lifecycle", label(input.lifecycleStatus)],
      ["Research status", label(input.researchStatus)],
      ["Consent", label(input.consentStatus)],
      ["Consent gate", label(input.consentGate)],
      ["Privacy gate", label(input.privacyGate)],
      ["Enrollment and evidence gate", label(input.wave1Gate)],
      ["FSH participant output", label(input.fshOutputStatus)],
      ["Soft-launch release gate", label(input.softLaunchReleaseGate)],
    ] as const,
  };
}
