import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { requireRole } from "./authorization";
import { AuthenticationError, AuthorizationError } from "./errors";

export const resolveRequestAdministrator = cache(() => requireRole("administrator"));

export async function requireAdminAccess(path: string) {
  try {
    return await resolveRequestAdministrator();
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
