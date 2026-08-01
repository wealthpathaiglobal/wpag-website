import { requireParticipantAccess } from "@/lib/auth/participant-access";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireParticipantAccess("/participant/consent", ["pending_enrollment", "active"]);
  return children;
}
