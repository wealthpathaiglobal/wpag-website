import { createClient } from "@/lib/supabase/server";
import type {
  CurrentParticipantProfile,
  ParticipantProfileDraftInput,
} from "@/lib/types/participant/participant-profile";

type ProfileRow = {
  first_name: string; middle_name: string | null; last_name: string;
  preferred_name: string | null; date_of_birth: string | null;
  gender: CurrentParticipantProfile["gender"] | null;
  marital_status: CurrentParticipantProfile["maritalStatus"] | null;
  email: string | null; phone_country_code: string | null;
  phone_number: string | null; country_code: string | null; state: string | null;
  district: string | null; city: string | null; postal_code: string | null;
  education_level: string | null; occupation: string | null;
  employment_status: CurrentParticipantProfile["employmentStatus"] | null;
  household_size: number | null; dependents: number | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null; profile_completed: boolean;
  profile_completed_at: string | null; updated_at: string;
};

export type ParticipantProfileRepositoryErrorKind =
  | "authentication_required" | "profile_unavailable" | "lifecycle_blocked"
  | "invalid_profile" | "incomplete_profile" | "persistence_failed";

export class ParticipantProfileRepositoryError extends Error {
  constructor(readonly kind: ParticipantProfileRepositoryErrorKind) {
    super("Participant profile operation could not be completed.");
    this.name = "ParticipantProfileRepositoryError";
  }
}

function mapError(error: { code?: string }): ParticipantProfileRepositoryError {
  const kinds: Record<string, ParticipantProfileRepositoryErrorKind> = {
    P1001: "authentication_required", P1002: "profile_unavailable",
    P1003: "lifecycle_blocked", P1004: "invalid_profile",
    P1005: "incomplete_profile",
  };
  return new ParticipantProfileRepositoryError(kinds[error.code ?? ""] ?? "persistence_failed");
}

function mapRow(row: ProfileRow): CurrentParticipantProfile {
  return {
    firstName: row.first_name, middleName: row.middle_name ?? "",
    lastName: row.last_name, preferredName: row.preferred_name ?? "",
    dateOfBirth: row.date_of_birth ?? "", gender: row.gender ?? "",
    maritalStatus: row.marital_status ?? "", email: row.email,
    phoneCountryCode: row.phone_country_code ?? "", phoneNumber: row.phone_number ?? "",
    countryCode: row.country_code ?? "", state: row.state ?? "",
    district: row.district ?? "", city: row.city ?? "", postalCode: row.postal_code ?? "",
    educationLevel: row.education_level ?? "", occupation: row.occupation ?? "",
    employmentStatus: row.employment_status ?? "", householdSize: row.household_size,
    dependents: row.dependents, emergencyContactName: row.emergency_contact_name ?? "",
    emergencyContactRelationship: row.emergency_contact_relationship ?? "",
    emergencyContactPhone: row.emergency_contact_phone ?? "",
    profileCompleted: row.profile_completed,
    profileCompletedAt: row.profile_completed_at, updatedAt: row.updated_at,
  };
}

function firstRow(data: unknown): ProfileRow | null {
  return ((Array.isArray(data) ? data[0] : data) as ProfileRow | null) ?? null;
}

export async function getCurrentParticipantProfile(): Promise<CurrentParticipantProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_current_participant_profile");
  if (error) throw mapError(error);
  const row = firstRow(data);
  return row ? mapRow(row) : null;
}

function rpcPayload(input: ParticipantProfileDraftInput) {
  return {
    p_first_name: input.firstName, p_middle_name: input.middleName,
    p_last_name: input.lastName, p_preferred_name: input.preferredName,
    p_date_of_birth: input.dateOfBirth || null, p_gender: input.gender || null,
    p_marital_status: input.maritalStatus || null,
    p_phone_country_code: input.phoneCountryCode, p_phone_number: input.phoneNumber,
    p_country_code: input.countryCode, p_state: input.state, p_district: input.district,
    p_city: input.city, p_postal_code: input.postalCode,
    p_education_level: input.educationLevel, p_occupation: input.occupation,
    p_employment_status: input.employmentStatus || null,
    p_household_size: input.householdSize, p_dependents: input.dependents,
    p_emergency_contact_name: input.emergencyContactName,
    p_emergency_contact_relationship: input.emergencyContactRelationship,
    p_emergency_contact_phone: input.emergencyContactPhone,
  };
}

export async function saveCurrentParticipantProfile(input: ParticipantProfileDraftInput) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_current_participant_profile", rpcPayload(input));
  if (error) throw mapError(error);
  const row = firstRow(data);
  if (!row) throw new ParticipantProfileRepositoryError("profile_unavailable");
  return mapRow(row);
}

export async function completeCurrentParticipantProfile() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_current_participant_profile");
  if (error) throw mapError(error);
  const row = firstRow(data);
  if (!row) throw new ParticipantProfileRepositoryError("profile_unavailable");
  return mapRow(row);
}
