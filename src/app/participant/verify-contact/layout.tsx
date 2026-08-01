import { requireParticipantAccess } from "@/lib/auth/participant-access";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireParticipantAccess("/participant/verify-contact", ["pending_enrollment", "active"]);
  return children;
}
