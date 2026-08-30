import { requireSyntheticConsentAccess } from "@/lib/consent/consent-access";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireSyntheticConsentAccess();
  return children;
}
