export const PUBLIC_PARTICIPATION_RELEASE_OPEN = "OPEN";

/**
 * Server-side public-participation release authority.
 *
 * This intentionally uses an exact comparison. Missing, malformed, differently
 * cased, BLOCKED, and UNRESOLVED values all fail closed.
 */
export function isPublicParticipationReleaseOpen(
  value: string | undefined = process.env.SOFT_LAUNCH_RELEASE_GATE,
): boolean {
  return value === PUBLIC_PARTICIPATION_RELEASE_OPEN;
}
