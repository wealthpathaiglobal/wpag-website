import { supabaseAdmin } from "@/lib/supabase/admin";

export const PARTICIPANT_B_AUTH_ID = "819bfdc4-630e-47d9-9dbb-ce4bcd56f5dd";
export const PARTICIPANT_B_EMAIL =
  "hfos-30c-closure-a0e9466-participant-b@synthetic.invalid";
export const PARTICIPANT_B_CODE = "WPAG-000002";

interface BootstrapEnvironment {
  HFOS_ENVIRONMENT?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SOFT_LAUNCH_RELEASE_GATE?: string;
}

export function assertParticipantBBootstrapEnvironment(
  environment: BootstrapEnvironment = process.env as BootstrapEnvironment,
) {
  let projectHost = "";

  try {
    projectHost = new URL(environment.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    // The common failure below deliberately reveals no environment detail.
  }

  if (
    environment.HFOS_ENVIRONMENT !== "STAGING" ||
    environment.SOFT_LAUNCH_RELEASE_GATE !== "BLOCKED" ||
    projectHost !== "dllefpzhmelflbmopdas.supabase.co"
  ) {
    throw new Error("Participant credential bootstrap is unavailable.");
  }
}

export async function bootstrapParticipantBPassword(password: string) {
  assertParticipantBBootstrapEnvironment();

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(
    PARTICIPANT_B_AUTH_ID,
  );

  if (
    error ||
    !data.user ||
    data.user.id !== PARTICIPANT_B_AUTH_ID ||
    data.user.email?.toLowerCase() !== PARTICIPANT_B_EMAIL
  ) {
    throw new Error("Participant credential bootstrap identity mismatch.");
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    PARTICIPANT_B_AUTH_ID,
    { password },
  );

  if (updateError) {
    throw new Error("Participant credential bootstrap could not be completed.");
  }
}
