import {
  AuthorizationError,
} from "./errors";

import {
  getCurrentStaff,
} from "./current-staff";

import {
  hasAnyRole,
  hasRole,
  isFounder,
  isStaff,
} from "./permissions";

export async function requireStaff() {
  const allowed = await isStaff();

  if (!allowed) {
    throw new AuthorizationError(
      "Staff access required."
    );
  }

  return getCurrentStaff();
}

export async function requireRole(
  roleCode: string
) {
  const allowed = await hasRole(roleCode);

  if (!allowed) {
    throw new AuthorizationError(
      `Required role: ${roleCode}`
    );
  }

  return getCurrentStaff();
}

export async function requireAnyRole(
  roleCodes: string[]
) {
  const allowed = await hasAnyRole(roleCodes);

  if (!allowed) {
    throw new AuthorizationError(
      "Required institutional role."
    );
  }

  return getCurrentStaff();
}

export async function requireFounder() {
  const allowed = await isFounder();

  if (!allowed) {
    throw new AuthorizationError(
      "Founder access required."
    );
  }

  return getCurrentStaff();
}