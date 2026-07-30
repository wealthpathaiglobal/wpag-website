import { createClient } from "@/lib/supabase/server";

import { getCurrentUser } from "./current-staff";

async function callBooleanFunction(
  functionName: string,
  payload: Record<string, unknown>
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(functionName, payload);

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function isStaff(): Promise<boolean> {
  const user = await getCurrentUser();

  return callBooleanFunction("is_staff", {
    p_auth_user_id: user.id,
  });
}

export async function hasRole(roleCode: string): Promise<boolean> {
  const user = await getCurrentUser();

  return callBooleanFunction("has_role", {
    p_auth_user_id: user.id,
    p_role_code: roleCode,
  });
}

export async function hasAnyRole(roleCodes: string[]): Promise<boolean> {
  const user = await getCurrentUser();

  return callBooleanFunction("has_any_role", {
    p_auth_user_id: user.id,
    p_role_codes: roleCodes,
  });
}

export async function isFounder(): Promise<boolean> {
  const user = await getCurrentUser();

  return callBooleanFunction("is_founder", {
    p_auth_user_id: user.id,
  });
}