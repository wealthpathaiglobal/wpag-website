import type { ReactNode } from "react";

import { requireAdminAccess } from "@/lib/auth/admin-access";

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  await requireAdminAccess("/admin/dashboard");

  return children;
}
