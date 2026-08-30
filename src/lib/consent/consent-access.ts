import { notFound, redirect } from "next/navigation";

import { AuthenticationError, AuthorizationError } from "@/lib/auth/errors";
import { getCurrentParticipant, getCurrentUser } from "@/lib/auth/current-participant";

const CONSENT_PATH = "/participant/consent";

type ConsentAccessEnvironment = {
  SOFT_LAUNCH_RELEASE_GATE?: string;
  HFOS_CONSENT_SYNTHETIC_TEST_GATE?: string;
  HFOS_CONSENT_SYNTHETIC_AUTH_USER_IDS?: string;
};

function parseAuthorizedUserIds(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

export function isSyntheticConsentAccessAuthorized(
  userId: string,
  environment: ConsentAccessEnvironment,
) {
  if (environment.SOFT_LAUNCH_RELEASE_GATE !== "BLOCKED") return false;
  if (environment.HFOS_CONSENT_SYNTHETIC_TEST_GATE !== "OPEN") return false;
  return parseAuthorizedUserIds(
    environment.HFOS_CONSENT_SYNTHETIC_AUTH_USER_IDS,
  ).has(userId);
}

export async function requireSyntheticConsentAccess(
  environment: ConsentAccessEnvironment = {
    SOFT_LAUNCH_RELEASE_GATE: process.env.SOFT_LAUNCH_RELEASE_GATE,
    HFOS_CONSENT_SYNTHETIC_TEST_GATE:
      process.env.HFOS_CONSENT_SYNTHETIC_TEST_GATE,
    HFOS_CONSENT_SYNTHETIC_AUTH_USER_IDS:
      process.env.HFOS_CONSENT_SYNTHETIC_AUTH_USER_IDS,
  },
) {
  try {
    const user = await getCurrentUser();
    const participant = await getCurrentParticipant();

    if (!["pending_enrollment", "active"].includes(participant.lifecycle_status)) {
      notFound();
    }
    if (!isSyntheticConsentAccessAuthorized(user.id, environment)) notFound();

    return participant;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect(`/auth/login?next=${encodeURIComponent(CONSENT_PATH)}`);
    }
    if (error instanceof AuthorizationError) notFound();
    throw error;
  }
}
