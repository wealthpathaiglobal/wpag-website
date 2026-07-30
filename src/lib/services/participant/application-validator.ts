/**
 * WPAG Participant Application Validator
 *
 * Responsibilities:
 * - Validate participant application input
 * - Normalize values before database persistence
 * - Return structured field-level validation errors
 *
 * This module must not:
 * - Access Supabase
 * - Perform database operations
 * - Generate application codes
 * - Return HTTP responses
 */

import type {
  ApplicationValidationError,
  ApplicationValidationResult,
  CreateApplicationRequest,
  NormalizedApplicationInput,
} from "./application-types";

const FIELD_LIMITS = {
  fullName: {
    min: 2,
    max: 150,
  },
  email: {
    max: 254,
  },
  phoneCountryCode: {
    max: 6,
  },
  phoneNumber: {
    min: 6,
    max: 15,
  },
  countryCode: {
    length: 2,
  },
  countryName: {
    max: 100,
  },
  stateOrRegion: {
    max: 100,
  },
  city: {
    max: 100,
  },
  timezone: {
    max: 100,
  },
  preferredLanguage: {
    max: 50,
  },
  ageGroup: {
    max: 50,
  },
  employmentStatus: {
    max: 100,
  },
  applicationReason: {
    min: 10,
    max: 2_000,
  },
  financialChallenges: {
    max: 3_000,
  },
  expectations: {
    max: 3_000,
  },
  referralSource: {
    max: 150,
  },
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PHONE_COUNTRY_CODE_PATTERN = /^\+[1-9]\d{0,4}$/;

const PHONE_NUMBER_PATTERN = /^\d{6,15}$/;

const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeOptionalText(
  value: string | undefined,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = normalizeWhitespace(value);

  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeRequiredText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return normalizeWhitespace(value);
}

function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}

function normalizePhoneCountryCode(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, "");
}

function normalizePhoneNumber(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\D/g, "");
}

function normalizeCountryCode(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toUpperCase();
}

function addRequiredError(
  errors: ApplicationValidationError[],
  field: keyof CreateApplicationRequest,
  label: string,
): void {
  errors.push({
    field,
    message: `${label} is required.`,
  });
}

function validateOptionalLength(
  errors: ApplicationValidationError[],
  field: keyof CreateApplicationRequest,
  value: string | null,
  maxLength: number,
  label: string,
): void {
  if (value !== null && value.length > maxLength) {
    errors.push({
      field,
      message: `${label} must not exceed ${maxLength} characters.`,
    });
  }
}

export function validateApplication(
  input: unknown,
): ApplicationValidationResult {
  const errors: ApplicationValidationError[] = [];

  if (
    typeof input !== "object" ||
    input === null ||
    Array.isArray(input)
  ) {
    return {
      valid: false,
      data: null,
      errors: [
        {
          field: "request",
          message: "Invalid application request.",
        },
      ],
    };
  }

  const request = input as Partial<CreateApplicationRequest>;

  const fullName = normalizeRequiredText(request.fullName);
  const email = normalizeEmail(request.email);
  const phoneCountryCode = normalizePhoneCountryCode(
    request.phoneCountryCode,
  );
  const phoneNumber = normalizePhoneNumber(request.phoneNumber);
  const countryCode = normalizeCountryCode(request.countryCode);
  const applicationReason = normalizeRequiredText(
    request.applicationReason,
  );

  const countryName = normalizeOptionalText(request.countryName);
  const stateOrRegion = normalizeOptionalText(request.stateOrRegion);
  const city = normalizeOptionalText(request.city);
  const timezone = normalizeOptionalText(request.timezone);
  const preferredLanguage = normalizeOptionalText(
    request.preferredLanguage,
  );
  const ageGroup = normalizeOptionalText(request.ageGroup);
  const employmentStatus = normalizeOptionalText(
    request.employmentStatus,
  );
  const financialChallenges = normalizeOptionalText(
    request.financialChallenges,
  );
  const expectations = normalizeOptionalText(request.expectations);
  const referralSource = normalizeOptionalText(request.referralSource);

  if (!fullName) {
    addRequiredError(errors, "fullName", "Full name");
  } else {
    if (fullName.length < FIELD_LIMITS.fullName.min) {
      errors.push({
        field: "fullName",
        message: `Full name must contain at least ${FIELD_LIMITS.fullName.min} characters.`,
      });
    }

    if (fullName.length > FIELD_LIMITS.fullName.max) {
      errors.push({
        field: "fullName",
        message: `Full name must not exceed ${FIELD_LIMITS.fullName.max} characters.`,
      });
    }
  }

  if (!email) {
    addRequiredError(errors, "email", "Email address");
  } else {
    if (email.length > FIELD_LIMITS.email.max) {
      errors.push({
        field: "email",
        message: `Email address must not exceed ${FIELD_LIMITS.email.max} characters.`,
      });
    } else if (!EMAIL_PATTERN.test(email)) {
      errors.push({
        field: "email",
        message: "Enter a valid email address.",
      });
    }
  }

  if (!phoneCountryCode) {
    addRequiredError(
      errors,
      "phoneCountryCode",
      "Phone country code",
    );
  } else if (
    phoneCountryCode.length > FIELD_LIMITS.phoneCountryCode.max ||
    !PHONE_COUNTRY_CODE_PATTERN.test(phoneCountryCode)
  ) {
    errors.push({
      field: "phoneCountryCode",
      message:
        "Enter a valid international phone country code, such as +91.",
    });
  }

  if (!phoneNumber) {
    addRequiredError(errors, "phoneNumber", "Phone number");
  } else if (!PHONE_NUMBER_PATTERN.test(phoneNumber)) {
    errors.push({
      field: "phoneNumber",
      message: `Phone number must contain between ${FIELD_LIMITS.phoneNumber.min} and ${FIELD_LIMITS.phoneNumber.max} digits.`,
    });
  }

  if (!countryCode) {
    addRequiredError(errors, "countryCode", "Country");
  } else if (
    countryCode.length !== FIELD_LIMITS.countryCode.length ||
    !COUNTRY_CODE_PATTERN.test(countryCode)
  ) {
    errors.push({
      field: "countryCode",
      message:
        "Country code must be a valid two-letter ISO country code.",
    });
  }

  if (!applicationReason) {
    addRequiredError(
      errors,
      "applicationReason",
      "Application reason",
    );
  } else {
    if (
      applicationReason.length < FIELD_LIMITS.applicationReason.min
    ) {
      errors.push({
        field: "applicationReason",
        message: `Application reason must contain at least ${FIELD_LIMITS.applicationReason.min} characters.`,
      });
    }

    if (
      applicationReason.length > FIELD_LIMITS.applicationReason.max
    ) {
      errors.push({
        field: "applicationReason",
        message: `Application reason must not exceed ${FIELD_LIMITS.applicationReason.max} characters.`,
      });
    }
  }

  if (request.privacyAcknowledged !== true) {
    errors.push({
      field: "privacyAcknowledged",
      message:
        "Privacy acknowledgement is required before submission.",
    });
  }

  validateOptionalLength(
    errors,
    "countryName",
    countryName,
    FIELD_LIMITS.countryName.max,
    "Country name",
  );

  validateOptionalLength(
    errors,
    "stateOrRegion",
    stateOrRegion,
    FIELD_LIMITS.stateOrRegion.max,
    "State or region",
  );

  validateOptionalLength(
    errors,
    "city",
    city,
    FIELD_LIMITS.city.max,
    "City",
  );

  validateOptionalLength(
    errors,
    "timezone",
    timezone,
    FIELD_LIMITS.timezone.max,
    "Timezone",
  );

  validateOptionalLength(
    errors,
    "preferredLanguage",
    preferredLanguage,
    FIELD_LIMITS.preferredLanguage.max,
    "Preferred language",
  );

  validateOptionalLength(
    errors,
    "ageGroup",
    ageGroup,
    FIELD_LIMITS.ageGroup.max,
    "Age group",
  );

  validateOptionalLength(
    errors,
    "employmentStatus",
    employmentStatus,
    FIELD_LIMITS.employmentStatus.max,
    "Employment status",
  );

  validateOptionalLength(
    errors,
    "financialChallenges",
    financialChallenges,
    FIELD_LIMITS.financialChallenges.max,
    "Financial challenges",
  );

  validateOptionalLength(
    errors,
    "expectations",
    expectations,
    FIELD_LIMITS.expectations.max,
    "Expectations",
  );

  validateOptionalLength(
    errors,
    "referralSource",
    referralSource,
    FIELD_LIMITS.referralSource.max,
    "Referral source",
  );

  if (errors.length > 0) {
    return {
      valid: false,
      data: null,
      errors,
    };
  }

  const normalizedData: NormalizedApplicationInput = {
    fullName,
    email,
    phoneCountryCode,
    phoneNumber,
    countryCode,
    countryName,
    stateOrRegion,
    city,
    timezone,
    preferredLanguage,
    ageGroup,
    employmentStatus,
    applicationReason,
    financialChallenges,
    expectations,
    referralSource,
    privacyAcknowledged: true,
  };

  return {
    valid: true,
    data: normalizedData,
    errors: [],
  };
}