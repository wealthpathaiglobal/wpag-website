import { notFound, redirect } from "next/navigation";

import { requireRole } from "./authorization";
import { AuthenticationError, AuthorizationError } from "./errors";

export async function requireAdminAccess(path: string) {
  try {
    return await requireRole("administrator");
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect(`/auth/login?next=${encodeURIComponent(path)}`);
    }

    if (error instanceof AuthorizationError) {
      notFound();
    }

    throw error;
  }
}
