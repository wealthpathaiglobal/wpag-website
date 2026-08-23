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

function participantState(value: string) {
  const states: Record<string, string> = {
    pending_enrollment: "Enrollment pending",
    active: "Active",
    paused: "Temporarily paused",
    completed: "Complete",
    withdrawn: "Withdrawn",
    archived: "Archived",
    not_enrolled: "Not enrolled in research",
    enrolled: "Participating in research",
    NOT_PRESENTED: "Information not yet presented",
    PRESENTED: "Ready for your choice",
    GRANTED: "Consent given",
    DECLINED: "Consent declined",
    UNRESOLVED: "Review pending",
    OPEN: "Available",
    BLOCKED: "Not available yet",
    SUPPRESSED: "Results not available",
  };
  return states[value] ?? label(value);
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
        "See your research participation status, key rights, privacy position, and available choices.",
      status: participantState(input.consentStatus),
      buttonLabel: "Open Research Status",
      href: "/participant/research-participation",
      available: true,
      mode: "contains_writes",
      notice: input.consentActionAvailable
        ? "Your research information is ready for review and a choice is available on the next page."
        : "You can view your status and send a question. Consent and withdrawal choices are not currently available.",
    },
    {
      id: "profile",
      number: "01",
      title: "Participant profile",
      description: "Review your contact, household, and emergency-contact information.",
      status: input.profileCompleted ? "Profile complete" : "Profile incomplete",
      buttonLabel: profileAvailable ? "View Profile" : "Profile Unavailable",
      href: profileAvailable ? "/participant/profile" : null,
      available: profileAvailable,
      mode: profileAvailable ? "contains_writes" : "unavailable",
      notice: profileAvailable
        ? "Viewing is available. Save Progress and Complete Profile update your profile only when you choose them."
        : "Profile access is unavailable for the current lifecycle.",
    },
    {
      id: "assessment",
      number: "02",
      title: "HFOS assessment",
      description:
        "Access the governed, non-diagnostic participant assessment when lifecycle authority permits.",
      status: active ? "Available now" : "Available after enrollment",
      buttonLabel: active ? "Open Assessment" : "Assessment Unavailable",
      href: active ? "/participant/assessment" : null,
      available: active,
      mode: active ? "contains_writes" : "unavailable",
      notice: active
        ? "Starting or editing an assessment saves the information you provide."
        : "You cannot start the assessment until your enrollment is active.",
    },
    {
      id: "evidence",
      number: "03",
      title: "Evidence submissions",
      description:
        "Access governed private evidence only when lifecycle and assessment context permit.",
      status: active ? input.evidenceStatus : "Available after enrollment",
      buttonLabel: active ? "Open Evidence" : "Evidence Unavailable",
      href: active ? "/participant/evidence" : null,
      available: active,
      mode: active ? "contains_writes" : "unavailable",
      notice: active
        ? "Uploading a file creates a protected evidence record and keeps its version history."
        : "You cannot view or upload evidence until your enrollment is active.",
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
      notice: "Tasks will appear here when this feature becomes available.",
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
      notice: "Follow-up dates will appear here when scheduling becomes available.",
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
      notice: "Portal messaging is not available yet.",
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
      notice: "A general documents area is not available yet.",
    },
    {
      id: "reports",
      number: "08",
      title: "Reports",
      description: "View reports released through the governed report lifecycle.",
      status: input.reportAvailable ? "Released report available" : "No released report available",
      buttonLabel: "View Reports",
      href: "/participant/reports",
      available: true,
      mode: "read_only",
      notice: "Only reports made available to you are shown. Viewing does not change your information.",
    },
  ];

  const journey: ParticipantDashboardJourneyStage[] = [
    {
      title: "Enrollment",
      status: participantState(input.lifecycleStatus),
      complete: ["active", "completed"].includes(input.lifecycleStatus),
    },
    {
      title: "Participant profile",
      status: input.profileCompleted ? "Complete" : "Incomplete",
      complete: input.profileCompleted,
    },
    {
      title: "Research participation",
      status: participantState(input.researchStatus),
      complete: ["enrolled", "completed"].includes(input.researchStatus),
    },
    {
      title: "Research consent",
      status: participantState(input.consentStatus),
      complete: input.consentStatus === "GRANTED" && input.consentGate === "OPEN",
    },
    {
      title: "Privacy review",
      status: participantState(input.privacyGate),
      complete: input.privacyGate === "OPEN",
    },
    {
      title: "Research results",
      status: participantState(input.fshOutputStatus),
      complete: false,
    },
    {
      title: "Portal release",
      status: participantState(input.softLaunchReleaseGate),
      complete: input.softLaunchReleaseGate === "OPEN",
    },
  ];

  return {
    controls,
    journey,
    assessmentAvailable: active,
    enrollmentNotice: active
      ? "Your enrollment is active. You can continue with the available items below."
      : `${participantState(input.lifecycleStatus)}. Assessment and evidence are not available yet.`,
    nextStep: active
      ? "Continue your assessment when you are ready. Evidence options appear only within an eligible assessment."
      : "Review your profile and research participation status. Assessment and evidence access begin only after enrollment is activated.",
    gateSummary: [
      ["Enrollment", participantState(input.lifecycleStatus), input.lifecycleStatus],
      ["Research participation", participantState(input.researchStatus), input.researchStatus],
      ["Consent", participantState(input.consentStatus), input.consentStatus],
      ["Consent availability", participantState(input.consentGate), input.consentGate],
      ["Privacy review", participantState(input.privacyGate), input.privacyGate],
      ["Enrollment and evidence", participantState(input.wave1Gate), input.wave1Gate],
      ["Research results", participantState(input.fshOutputStatus), input.fshOutputStatus],
      ["Portal release", participantState(input.softLaunchReleaseGate), input.softLaunchReleaseGate],
    ] as const,
  };
}
