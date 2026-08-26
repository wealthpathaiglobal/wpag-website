import {
  completeCurrentParticipantProfile,
  getCurrentParticipantProfile,
  ParticipantProfileRepositoryError,
  saveCurrentParticipantProfile,
} from "@/lib/repositories/participant/participant-profile-repository";
import {
  participantProfileDraftFields,
  type CurrentParticipantProfile,
  type ParticipantProfileActionResult,
  type ParticipantProfileDraftField,
  type ParticipantProfileDraftInput,
  type ParticipantProfileFieldErrors,
  type ParticipantProfileWriteInput,
} from "@/lib/types/participant/participant-profile";

const genders = new Set(["", "male", "female", "other", "prefer_not_to_say"]);
const maritalStatuses = new Set(["", "single", "married", "divorced", "widowed", "separated", "other", "prefer_not_to_say"]);
const employmentStatuses = new Set(["", "employed", "self_employed", "business_owner", "student", "homemaker", "retired", "unemployed", "other"]);

const requiredFields: readonly ParticipantProfileDraftField[] = [
  "firstName", "lastName", "dateOfBirth", "gender", "maritalStatus",
  "phoneCountryCode", "phoneNumber", "countryCode", "state", "city",
  "postalCode", "employmentStatus", "householdSize", "dependents",
  "emergencyContactName", "emergencyContactRelationship", "emergencyContactPhone",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function blankDraft(): ParticipantProfileDraftInput {
  return {
    firstName: "", middleName: "", lastName: "", preferredName: "",
    dateOfBirth: "", gender: "", maritalStatus: "", phoneCountryCode: "",
    phoneNumber: "", countryCode: "", state: "", district: "", city: "",
    postalCode: "", educationLevel: "", occupation: "", employmentStatus: "",
    householdSize: null, dependents: null, emergencyContactName: "",
    emergencyContactRelationship: "", emergencyContactPhone: "",
  };
}

function editableProfile(profile: CurrentParticipantProfile): ParticipantProfileDraftInput {
  const { email: _email, profileCompleted: _completed,
    profileCompletedAt: _completedAt, updatedAt: _updatedAt, ...draft } = profile;
  void _email;
  void _completed;
  void _completedAt;
  void _updatedAt;
  return draft;
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : null;
}

export function validateParticipantProfileDraft(
  value: unknown,
  existing?: CurrentParticipantProfile,
  requireComplete = false,
): { input?: ParticipantProfileDraftInput; fieldErrors: ParticipantProfileFieldErrors; formError?: string } {
  if (!isRecord(value)) return { fieldErrors: {}, formError: "Invalid profile request." };
  const allowed = new Set<string>(participantProfileDraftFields);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    return { fieldErrors: {}, formError: "Invalid profile request." };
  }

  const input = existing ? editableProfile(existing) : blankDraft();
  const errors: ParticipantProfileFieldErrors = {};
  for (const field of participantProfileDraftFields) {
    if (!(field in value)) continue;
    const raw = value[field];
    if (field === "householdSize" || field === "dependents") {
      if (raw !== null && (!Number.isInteger(raw) || typeof raw !== "number")) {
        errors[field] = "Enter a whole number.";
      } else input[field] = raw as number | null;
    } else {
      const normalized = normalizeString(raw);
      if (normalized === null) errors[field] = "Enter text for this field.";
      else (input[field] as string) = normalized;
    }
  }

  input.countryCode = input.countryCode.toUpperCase();
  if (!input.firstName) errors.firstName = "First name is required.";
  if (!input.lastName) errors.lastName = "Last name is required.";
  if (input.dateOfBirth && (!/^\d{4}-\d{2}-\d{2}$/.test(input.dateOfBirth) || new Date(`${input.dateOfBirth}T00:00:00Z`) > new Date())) errors.dateOfBirth = "Enter a valid date of birth that is not in the future.";
  if (!genders.has(input.gender)) errors.gender = "Select a valid gender option.";
  if (!maritalStatuses.has(input.maritalStatus)) errors.maritalStatus = "Select a valid marital status.";
  if (!employmentStatuses.has(input.employmentStatus)) errors.employmentStatus = "Select a valid employment status.";
  if (input.phoneCountryCode && !/^\+[1-9]\d{0,3}$/.test(input.phoneCountryCode)) errors.phoneCountryCode = "Use an international code such as +91.";
  if (input.phoneNumber && !/^\d[\d -]{5,19}$/.test(input.phoneNumber)) errors.phoneNumber = "Enter a valid phone number.";
  if (input.countryCode && !/^[A-Z]{2}$/.test(input.countryCode)) errors.countryCode = "Use a two-letter country code.";
  if (input.postalCode && !/^[A-Za-z0-9][A-Za-z0-9 -]{1,19}$/.test(input.postalCode)) errors.postalCode = "Enter a valid postal code.";
  if (input.householdSize !== null && (input.householdSize < 1 || input.householdSize > 100)) errors.householdSize = "Household size must be between 1 and 100.";
  if (input.dependents !== null && (input.dependents < 0 || input.dependents > 100 || (input.householdSize !== null && input.dependents > input.householdSize))) errors.dependents = "Dependants must be between 0 and the household size.";
  if (input.emergencyContactPhone && !/^\+[1-9][\d -]{6,23}$/.test(input.emergencyContactPhone)) errors.emergencyContactPhone = "Enter the emergency phone in international format.";

  if (requireComplete) {
    for (const field of requiredFields) {
      const current = input[field];
      if (current === null || (typeof current === "string" && !current)) {
        errors[field] ??= "This field is required to complete the profile.";
      }
    }
  }
  return { input, fieldErrors: errors };
}

function safeFailure(error: unknown): ParticipantProfileActionResult {
  if (error instanceof ParticipantProfileRepositoryError) {
    if (error.kind === "lifecycle_blocked") return { success: false, errorCode: "lifecycle_blocked", formError: "Profile changes are not available for the current participant status." };
    if (error.kind === "profile_unavailable") return { success: false, errorCode: "profile_unavailable", formError: "Participant profile is unavailable." };
    if (error.kind === "authentication_required") return { success: false, errorCode: "authentication_required", formError: "Authentication is required." };
    if (error.kind === "conflict") return { success: false, errorCode: "conflict", formError: "This profile was updated in another session. Refresh the page before trying again." };
    if (error.kind === "incomplete_profile" || error.kind === "invalid_profile") return { success: false, errorCode: "validation", formError: "Please correct the profile details and try again." };
  }
  console.error("[WPAG Participant Profile] Profile operation failed.");
  return { success: false, errorCode: "persistence_failed", formError: "The profile could not be updated. Please try again." };
}

function parseWrite(value: unknown): ParticipantProfileWriteInput | null {
  if (!isRecord(value) || !isRecord(value.profile) || typeof value.expectedUpdatedAt !== "string") return null;
  if (Object.keys(value).some((key) => key !== "profile" && key !== "expectedUpdatedAt")) return null;
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value.expectedUpdatedAt) || Number.isNaN(Date.parse(value.expectedUpdatedAt))) return null;
  return value as unknown as ParticipantProfileWriteInput;
}

export async function loadParticipantProfile() {
  return getCurrentParticipantProfile();
}

export async function saveParticipantProfile(value: unknown): Promise<ParticipantProfileActionResult> {
  try {
    const write = parseWrite(value);
    if (!write) return { success: false, errorCode: "validation", formError: "Invalid profile request." };
    const validation = validateParticipantProfileDraft(write.profile);
    if (!validation.input || validation.formError || Object.keys(validation.fieldErrors).length) return { success: false, fieldErrors: validation.fieldErrors, formError: validation.formError };
    return { success: true, profile: await saveCurrentParticipantProfile(validation.input, write.expectedUpdatedAt) };
  } catch (error) { return safeFailure(error); }
}

export async function completeParticipantProfile(value: unknown): Promise<ParticipantProfileActionResult> {
  try {
    const write = parseWrite(value);
    if (!write) return { success: false, errorCode: "validation", formError: "Invalid profile request." };
    const validation = validateParticipantProfileDraft(write.profile, undefined, true);
    if (!validation.input || validation.formError || Object.keys(validation.fieldErrors).length) return { success: false, errorCode: "validation", fieldErrors: validation.fieldErrors, formError: validation.formError ?? "Complete the required fields before completing the profile." };
    return { success: true, profile: await completeCurrentParticipantProfile(validation.input!, write.expectedUpdatedAt) };
  } catch (error) { return safeFailure(error); }
}
