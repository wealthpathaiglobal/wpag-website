export const RECOVERY_CALLBACK_PATH = "/auth/recovery-callback";
export const RECOVERY_DESTINATION = "/auth/update-password";

export function getRecoveryCallbackUrl(origin: string): string {
  return new URL(RECOVERY_CALLBACK_PATH, origin).toString();
}
