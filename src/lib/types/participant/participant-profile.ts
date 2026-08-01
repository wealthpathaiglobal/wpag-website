export const participantProfileDraftFields = [
  "firstName", "middleName", "lastName", "preferredName", "dateOfBirth",
  "gender", "maritalStatus", "phoneCountryCode", "phoneNumber",
  "countryCode", "state", "district", "city", "postalCode",
  "educationLevel", "occupation", "employmentStatus", "householdSize",
  "dependents", "emergencyContactName", "emergencyContactRelationship",
  "emergencyContactPhone",
] as const;

export type ParticipantProfileDraftField =
  (typeof participantProfileDraftFields)[number];

export type ParticipantProfileGender =
  | "male" | "female" | "other" | "prefer_not_to_say";

export type ParticipantProfileMaritalStatus =
  | "single" | "married" | "divorced" | "widowed" | "separated"
  | "other" | "prefer_not_to_say";

export type ParticipantProfileEmploymentStatus =
  | "employed" | "self_employed" | "business_owner" | "student"
  | "homemaker" | "retired" | "unemployed" | "other";

export interface ParticipantProfileDraftInput {
  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;
  dateOfBirth: string;
  gender: ParticipantProfileGender | "";
  maritalStatus: ParticipantProfileMaritalStatus | "";
  phoneCountryCode: string;
  phoneNumber: string;
  countryCode: string;
  state: string;
  district: string;
  city: string;
  postalCode: string;
  educationLevel: string;
  occupation: string;
  employmentStatus: ParticipantProfileEmploymentStatus | "";
  householdSize: number | null;
  dependents: number | null;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
}

export interface CurrentParticipantProfile extends ParticipantProfileDraftInput {
  email: string | null;
  profileCompleted: boolean;
  profileCompletedAt: string | null;
  updatedAt: string;
}

export type ParticipantProfileFieldErrors = Partial<
  Record<ParticipantProfileDraftField, string>
>;

export interface ParticipantProfileActionResult {
  success: boolean;
  profile?: CurrentParticipantProfile;
  fieldErrors?: ParticipantProfileFieldErrors;
  formError?: string;
}
