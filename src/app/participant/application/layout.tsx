import type { ReactNode } from "react";

import { PublicParticipationUnavailable } from "@/components/participant/PublicParticipationUnavailable";
import { isPublicParticipationReleaseOpen } from "@/lib/governance/public-participation-release-gate";

export const dynamic = "force-dynamic";

export default function ParticipantApplicationLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  if (!isPublicParticipationReleaseOpen()) {
    return <PublicParticipationUnavailable step="application" />;
  }

  return children;
}
