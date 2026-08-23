import { getSafeInternalPath } from "@/lib/auth/safe-redirect";
import {
  recordParticipantPortalTiming,
  type ParticipantPortalTimingRecorder,
} from "@/lib/observability/participant-portal-timing";

type SignInError = { message: string };

type ParticipantSignInClient = {
  auth: {
    signInWithPassword(credentials: {
      email: string;
      password: string;
    }): Promise<{ error: SignInError | null }>;
  };
};

type ParticipantLoginRouter = {
  replace(path: string): void;
};

type ParticipantLoginFlowInput = {
  supabase: ParticipantSignInClient;
  router: ParticipantLoginRouter;
  email: string;
  password: string;
  requestedNext: string | null | undefined;
  now?: () => number;
  recordTiming?: ParticipantPortalTimingRecorder;
};

export async function signInParticipantAndNavigate({
  supabase,
  router,
  email,
  password,
  requestedNext,
  now = () => performance.now(),
  recordTiming = recordParticipantPortalTiming,
}: ParticipantLoginFlowInput): Promise<{ error: SignInError | null }> {
  const startedAt = now();
  const result = await supabase.auth.signInWithPassword({ email, password });

  recordTiming("sign_in_complete", now() - startedAt);

  if (result.error) return result;

  const next = getSafeInternalPath(
    requestedNext,
    "/participant/dashboard",
  );

  recordTiming("navigation_start", now() - startedAt);
  router.replace(next);

  return result;
}
