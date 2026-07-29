import { createClient } from "@/lib/supabase/server";

import { AuthenticationError } from "./errors";

export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthenticationError();
  }

  return user;
}

export async function getCurrentStaff() {
  const supabase = await createClient();

  const user = await getCurrentUser();

  console.log("AUTH USER:", user.id);

  const { data, error } = await supabase
    .from("staff_members")
    .select("*")
    .eq("auth_user_id", user.id)
    .eq("status", "active")
    .single();

  console.log("STAFF DATA:", data);
  console.log("STAFF ERROR:", error);

  if (error || !data) {
    throw new AuthenticationError(
      "Authenticated user is not an active staff member."
    );
  }

  return data;
}