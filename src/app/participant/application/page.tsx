"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type {
  ApplicationValidationError,
  CreateApplicationErrorResponse,
  CreateApplicationRequest,
  CreateApplicationSuccessResponse,
} from "@/lib/services/participant/application-types";
import { typography } from "@/styles/typography";
import { Button } from "@/ui/button";

type CountryOption = {
  code: string;
  name: string;
  phoneCode: string;
  timezone: string;
  language: string;
};

type ApplicationForm = {
  fullName: string;
  email: string;
  countryCode: string;
  phoneCountryCode: string;
  phoneNumber: string;
  stateOrRegion: string;
  city: string;
  timezone: string;
  preferredLanguage: string;
  ageGroup: string;
  employmentStatus: string;
  applicationReason: string;
  financialChallenges: string;
  expectations: string;
  referralSource: string;
  privacyAcknowledged: boolean;
};

type FieldErrors = Partial<
  Record<keyof CreateApplicationRequest | "request", string>
>;

const COUNTRY_OPTIONS: CountryOption[] = [
  {
    code: "IN",
    name: "India",
    phoneCode: "+91",
    timezone: "Asia/Kolkata",
    language: "English",
  },
  {
    code: "US",
    name: "United States",
    phoneCode: "+1",
    timezone: "America/New_York",
    language: "English",
  },
  {
    code: "GB",
    name: "United Kingdom",
    phoneCode: "+44",
    timezone: "Europe/London",
    language: "English",
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    phoneCode: "+971",
    timezone: "Asia/Dubai",
    language: "English",
  },
  {
    code: "AU",
    name: "Australia",
    phoneCode: "+61",
    timezone: "Australia/Sydney",
    language: "English",
  },
  {
    code: "CA",
    name: "Canada",
    phoneCode: "+1",
    timezone: "America/Toronto",
    language: "English",
  },
  {
    code: "SG",
    name: "Singapore",
    phoneCode: "+65",
    timezone: "Asia/Singapore",
    language: "English",
  },
  {
    code: "MY",
    name: "Malaysia",
    phoneCode: "+60",
    timezone: "Asia/Kuala_Lumpur",
    language: "English",
  },
  {
    code: "NZ",
    name: "New Zealand",
    phoneCode: "+64",
    timezone: "Pacific/Auckland",
    language: "English",
  },
  {
    code: "DE",
    name: "Germany",
    phoneCode: "+49",
    timezone: "Europe/Berlin",
    language: "German",
  },
  {
    code: "FR",
    name: "France",
    phoneCode: "+33",
    timezone: "Europe/Paris",
    language: "French",
  },
  {
    code: "IT",
    name: "Italy",
    phoneCode: "+39",
    timezone: "Europe/Rome",
    language: "Italian",
  },
  {
    code: "ES",
    name: "Spain",
    phoneCode: "+34",
    timezone: "Europe/Madrid",
    language: "Spanish",
  },
  {
    code: "NL",
    name: "Netherlands",
    phoneCode: "+31",
    timezone: "Europe/Amsterdam",
    language: "Dutch",
  },
  {
    code: "CH",
    name: "Switzerland",
    phoneCode: "+41",
    timezone: "Europe/Zurich",
    language: "English",
  },
  {
    code: "SE",
    name: "Sweden",
    phoneCode: "+46",
    timezone: "Europe/Stockholm",
    language: "Swedish",
  },
  {
    code: "NO",
    name: "Norway",
    phoneCode: "+47",
    timezone: "Europe/Oslo",
    language: "Norwegian",
  },
  {
    code: "DK",
    name: "Denmark",
    phoneCode: "+45",
    timezone: "Europe/Copenhagen",
    language: "Danish",
  },
  {
    code: "IE",
    name: "Ireland",
    phoneCode: "+353",
    timezone: "Europe/Dublin",
    language: "English",
  },
  {
    code: "ZA",
    name: "South Africa",
    phoneCode: "+27",
    timezone: "Africa/Johannesburg",
    language: "English",
  },
  {
    code: "NG",
    name: "Nigeria",
    phoneCode: "+234",
    timezone: "Africa/Lagos",
    language: "English",
  },
  {
    code: "KE",
    name: "Kenya",
    phoneCode: "+254",
    timezone: "Africa/Nairobi",
    language: "English",
  },
  {
    code: "JP",
    name: "Japan",
    phoneCode: "+81",
    timezone: "Asia/Tokyo",
    language: "Japanese",
  },
  {
    code: "KR",
    name: "South Korea",
    phoneCode: "+82",
    timezone: "Asia/Seoul",
    language: "Korean",
  },
  {
    code: "PH",
    name: "Philippines",
    phoneCode: "+63",
    timezone: "Asia/Manila",
    language: "English",
  },
  {
    code: "ID",
    name: "Indonesia",
    phoneCode: "+62",
    timezone: "Asia/Jakarta",
    language: "Indonesian",
  },
  {
    code: "BR",
    name: "Brazil",
    phoneCode: "+55",
    timezone: "America/Sao_Paulo",
    language: "Portuguese",
  },
  {
    code: "MX",
    name: "Mexico",
    phoneCode: "+52",
    timezone: "America/Mexico_City",
    language: "Spanish",
  },
];

const initialForm: ApplicationForm = {
  fullName: "",
  email: "",
  countryCode: "",
  phoneCountryCode: "",
  phoneNumber: "",
  stateOrRegion: "",
  city: "",
  timezone: "",
  preferredLanguage: "",
  ageGroup: "",
  employmentStatus: "",
  applicationReason: "",
  financialChallenges: "",
  expectations: "",
  referralSource: "",
  privacyAcknowledged: false,
};

const inputClassName =
  "mt-3 min-h-12 w-full border border-zinc-700 bg-black px-4 py-3 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-white disabled:cursor-not-allowed disabled:opacity-60";

const textareaClassName =
  "mt-3 min-h-36 w-full resize-y border border-zinc-700 bg-black px-4 py-3 text-base leading-7 text-white outline-none transition placeholder:text-zinc-600 focus:border-white disabled:cursor-not-allowed disabled:opacity-60";

function createFieldErrors(
  errors: ApplicationValidationError[] | undefined,
): FieldErrors {
  if (!errors) {
    return {};
  }

  return errors.reduce<FieldErrors>((result, error) => {
    if (!result[error.field]) {
      result[error.field] = error.message;
    }

    return result;
  }, {});
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 text-sm leading-6 text-red-300" role="alert">
      {message}
    </p>
  );
}

export default function ParticipantApplicationPage() {
  const router = useRouter();

  const [form, setForm] = useState<ApplicationForm>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof ApplicationForm>(
    field: K,
    value: ApplicationForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFieldErrors((current) => {
      if (!current[field as keyof CreateApplicationRequest]) {
        return current;
      }

      const updated = { ...current };
      delete updated[field as keyof CreateApplicationRequest];

      return updated;
    });

    setGeneralError(null);
  }

  function handleCountryChange(countryCode: string) {
    const selectedCountry = COUNTRY_OPTIONS.find(
      (country) => country.code === countryCode,
    );

    setForm((current) => ({
      ...current,
      countryCode,
      phoneCountryCode: selectedCountry?.phoneCode ?? "",
      timezone: selectedCountry?.timezone ?? "",
      preferredLanguage: selectedCountry?.language ?? "",
    }));

    setFieldErrors((current) => {
      const updated = { ...current };

      delete updated.countryCode;
      delete updated.phoneCountryCode;
      delete updated.timezone;
      delete updated.preferredLanguage;

      return updated;
    });

    setGeneralError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setGeneralError(null);

    const selectedCountry = COUNTRY_OPTIONS.find(
      (country) => country.code === form.countryCode,
    );

    const payload: CreateApplicationRequest = {
      fullName: form.fullName,
      email: form.email,
      phoneCountryCode: form.phoneCountryCode,
      phoneNumber: form.phoneNumber,
      countryCode: form.countryCode,
      countryName: selectedCountry?.name,
      stateOrRegion: form.stateOrRegion,
      city: form.city,
      timezone: form.timezone,
      preferredLanguage: form.preferredLanguage,
      ageGroup: form.ageGroup,
      employmentStatus: form.employmentStatus,
      applicationReason: form.applicationReason,
      financialChallenges: form.financialChallenges,
      expectations: form.expectations,
      referralSource: form.referralSource,
      privacyAcknowledged: form.privacyAcknowledged,
    };

    try {
      const response = await fetch("/api/participant/application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as
        | CreateApplicationSuccessResponse
        | CreateApplicationErrorResponse;

      if (!response.ok || !result.success) {
        const errors =
          "errors" in result ? createFieldErrors(result.errors) : {};

        setFieldErrors(errors);
        setGeneralError(result.message);

        return;
      }

      router.push("/participant/application-submitted");
    } catch (error) {
      console.error(
        "[WPAG Participant Application] Submission failed",
        error,
      );

      setGeneralError(
        "The application could not be submitted. Check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-black text-white">
        <section className="py-24">
          <Container>
            <div className="max-w-4xl">
              <p className={`mb-6 ${typography.caption}`}>
                Participant Journey · Step 3
              </p>

              <h1 className={typography.display}>
                Participant application.
              </h1>

              <p className={`mt-8 max-w-3xl ${typography.bodyLarge}`}>
                Provide the preliminary information required for Wealth Path AI
                Global to assess your application for participation in a
                research programme.
              </p>

              <div className="mt-8 border border-zinc-800 p-6">
                <p className="text-sm leading-6 text-zinc-400">
                  Submitting this application does not create a participant
                  account, confirm eligibility, record formal informed consent,
                  or guarantee enrollment. Every application remains subject to
                  programme, jurisdictional, identity, privacy, and governance
                  review.
                </p>
              </div>

              <form className="mt-16" onSubmit={handleSubmit} noValidate>
                <section>
                  <p className={typography.caption}>01 · Identity</p>

                  <div className="mt-8 grid gap-x-8 gap-y-8 md:grid-cols-2">
                    <label className="block md:col-span-2">
                      <span className="text-sm font-semibold text-white">
                        Full name *
                      </span>

                      <input
                        className={inputClassName}
                        type="text"
                        autoComplete="name"
                        maxLength={150}
                        disabled={isSubmitting}
                        aria-invalid={Boolean(fieldErrors.fullName)}
                        value={form.fullName}
                        onChange={(event) =>
                          updateField("fullName", event.target.value)
                        }
                      />

                      <FieldError message={fieldErrors.fullName} />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="text-sm font-semibold text-white">
                        Email address *
                      </span>

                      <input
                        className={inputClassName}
                        type="email"
                        autoComplete="email"
                        maxLength={254}
                        disabled={isSubmitting}
                        aria-invalid={Boolean(fieldErrors.email)}
                        value={form.email}
                        onChange={(event) =>
                          updateField("email", event.target.value)
                        }
                      />

                      <FieldError message={fieldErrors.email} />
                    </label>
                  </div>
                </section>

                <section className="mt-16 border-t border-zinc-800 pt-16">
                  <p className={typography.caption}>
                    02 · Contact and location
                  </p>

                  <div className="mt-8 grid gap-x-8 gap-y-8 md:grid-cols-2">
                    <label className="block md:col-span-2">
                      <span className="text-sm font-semibold text-white">
                        Country or territory *
                      </span>

                      <select
                        className={inputClassName}
                        disabled={isSubmitting}
                        aria-invalid={Boolean(fieldErrors.countryCode)}
                        value={form.countryCode}
                        onChange={(event) =>
                          handleCountryChange(event.target.value)
                        }
                      >
                        <option value="">Select a country or territory</option>

                        {COUNTRY_OPTIONS.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.name}
                          </option>
                        ))}
                      </select>

                      <FieldError message={fieldErrors.countryCode} />
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-white">
                        International calling code *
                      </span>

                      <input
                        className={inputClassName}
                        type="text"
                        inputMode="tel"
                        placeholder="+91"
                        maxLength={6}
                        disabled={isSubmitting}
                        aria-invalid={Boolean(
                          fieldErrors.phoneCountryCode,
                        )}
                        value={form.phoneCountryCode}
                        onChange={(event) =>
                          updateField(
                            "phoneCountryCode",
                            event.target.value,
                          )
                        }
                      />

                      <FieldError
                        message={fieldErrors.phoneCountryCode}
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-white">
                        Mobile or telephone number *
                      </span>

                      <input
                        className={inputClassName}
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        placeholder="Phone number without country code"
                        disabled={isSubmitting}
                        aria-invalid={Boolean(fieldErrors.phoneNumber)}
                        value={form.phoneNumber}
                        onChange={(event) =>
                          updateField("phoneNumber", event.target.value)
                        }
                      />

                      <FieldError message={fieldErrors.phoneNumber} />
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-white">
                        State or region
                      </span>

                      <input
                        className={inputClassName}
                        type="text"
                        autoComplete="address-level1"
                        maxLength={100}
                        disabled={isSubmitting}
                        aria-invalid={Boolean(fieldErrors.stateOrRegion)}
                        value={form.stateOrRegion}
                        onChange={(event) =>
                          updateField("stateOrRegion", event.target.value)
                        }
                      />

                      <FieldError message={fieldErrors.stateOrRegion} />
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-white">
                        City
                      </span>

                      <input
                        className={inputClassName}
                        type="text"
                        autoComplete="address-level2"
                        maxLength={100}
                        disabled={isSubmitting}
                        aria-invalid={Boolean(fieldErrors.city)}
                        value={form.city}
                        onChange={(event) =>
                          updateField("city", event.target.value)
                        }
                      />

                      <FieldError message={fieldErrors.city} />
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-white">
                        Time zone
                      </span>

                      <input
                        className={inputClassName}
                        type="text"
                        placeholder="Example: Asia/Kolkata"
                        maxLength={100}
                        disabled={isSubmitting}
                        aria-invalid={Boolean(fieldErrors.timezone)}
                        value={form.timezone}
                        onChange={(event) =>
                          updateField("timezone", event.target.value)
                        }
                      />

                      <FieldError message={fieldErrors.timezone} />
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-white">
                        Preferred communication language
                      </span>

                      <input
                        className={inputClassName}
                        type="text"
                        maxLength={50}
                        disabled={isSubmitting}
                        aria-invalid={Boolean(
                          fieldErrors.preferredLanguage,
                        )}
                        value={form.preferredLanguage}
                        onChange={(event) =>
                          updateField(
                            "preferredLanguage",
                            event.target.value,
                          )
                        }
                      />

                      <FieldError
                        message={fieldErrors.preferredLanguage}
                      />
                    </label>
                  </div>
                </section>

                <section className="mt-16 border-t border-zinc-800 pt-16">
                  <p className={typography.caption}>
                    03 · Preliminary profile
                  </p>

                  <div className="mt-8 grid gap-x-8 gap-y-8 md:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-semibold text-white">
                        Age group
                      </span>

                      <select
                        className={inputClassName}
                        disabled={isSubmitting}
                        aria-invalid={Boolean(fieldErrors.ageGroup)}
                        value={form.ageGroup}
                        onChange={(event) =>
                          updateField("ageGroup", event.target.value)
                        }
                      >
                        <option value="">Select an age group</option>
                        <option value="18_24">18–24</option>
                        <option value="25_34">25–34</option>
                        <option value="35_44">35–44</option>
                        <option value="45_54">45–54</option>
                        <option value="55_64">55–64</option>
                        <option value="65_plus">65 or above</option>
                      </select>

                      <FieldError message={fieldErrors.ageGroup} />
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-white">
                        Employment status
                      </span>

                      <select
                        className={inputClassName}
                        disabled={isSubmitting}
                        aria-invalid={Boolean(
                          fieldErrors.employmentStatus,
                        )}
                        value={form.employmentStatus}
                        onChange={(event) =>
                          updateField(
                            "employmentStatus",
                            event.target.value,
                          )
                        }
                      >
                        <option value="">
  Select an employment status
</option>
<option value="employed">
  Employed full-time
</option>
<option value="employed">
  Employed part-time
</option>
<option value="self_employed">Self-employed</option>
<option value="business_owner">
  Business owner
</option>
<option value="student">Student</option>
<option value="unemployed">Unemployed</option>
<option value="retired">Retired</option>
<option value="homemaker">Homemaker</option>
<option value="other">Other</option>
                      </select>

                      <FieldError
                        message={fieldErrors.employmentStatus}
                      />
                    </label>
                  </div>
                </section>

                <section className="mt-16 border-t border-zinc-800 pt-16">
                  <p className={typography.caption}>
                    04 · Application information
                  </p>

                  <div className="mt-8 grid gap-y-8">
                    <label className="block">
                      <span className="text-sm font-semibold text-white">
                        Why do you want to participate in the WPAG research
                        programme? *
                      </span>

                      <textarea
                        className={textareaClassName}
                        minLength={10}
                        maxLength={2000}
                        disabled={isSubmitting}
                        aria-invalid={Boolean(
                          fieldErrors.applicationReason,
                        )}
                        placeholder="Briefly explain your reason for applying."
                        value={form.applicationReason}
                        onChange={(event) =>
                          updateField(
                            "applicationReason",
                            event.target.value,
                          )
                        }
                      />

                      <div className="mt-2 flex items-start justify-between gap-4">
                        <FieldError
                          message={fieldErrors.applicationReason}
                        />

                        <span className="ml-auto text-xs text-zinc-600">
                          {form.applicationReason.length}/2000
                        </span>
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-white">
                        Financial challenges
                      </span>

                      <textarea
                        className={textareaClassName}
                        maxLength={3000}
                        disabled={isSubmitting}
                        aria-invalid={Boolean(
                          fieldErrors.financialChallenges,
                        )}
                        placeholder="Describe any current financial pressures or challenges you consider relevant."
                        value={form.financialChallenges}
                        onChange={(event) =>
                          updateField(
                            "financialChallenges",
                            event.target.value,
                          )
                        }
                      />

                      <FieldError
                        message={fieldErrors.financialChallenges}
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-white">
                        What do you expect from participation?
                      </span>

                      <textarea
                        className={textareaClassName}
                        maxLength={3000}
                        disabled={isSubmitting}
                        aria-invalid={Boolean(fieldErrors.expectations)}
                        placeholder="Describe what you hope to understand, improve, or achieve."
                        value={form.expectations}
                        onChange={(event) =>
                          updateField("expectations", event.target.value)
                        }
                      />

                      <FieldError message={fieldErrors.expectations} />
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-white">
                        How did you hear about WPAG?
                      </span>

                      <select
                        className={inputClassName}
                        disabled={isSubmitting}
                        aria-invalid={Boolean(fieldErrors.referralSource)}
                        value={form.referralSource}
                        onChange={(event) =>
                          updateField(
                            "referralSource",
                            event.target.value,
                          )
                        }
                      >
                        <option value="">Select a source</option>
                        <option value="WPAG website">WPAG website</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Google">Google</option>
                        <option value="Bing">Bing</option>
                        <option value="Friend or family">
                          Friend or family
                        </option>
                        <option value="Professional referral">
                          Professional referral
                        </option>
                        <option value="Other">Other</option>
                      </select>

                      <FieldError message={fieldErrors.referralSource} />
                    </label>
                  </div>
                </section>

                <section className="mt-16 border-t border-zinc-800 pt-16">
                  <p className={typography.caption}>
                    05 · Privacy acknowledgement
                  </p>

                  <label className="mt-8 flex cursor-pointer items-start gap-4 border border-zinc-800 p-6">
                    <input
                      className="mt-1 h-5 w-5 accent-white"
                      type="checkbox"
                      disabled={isSubmitting}
                      checked={form.privacyAcknowledged}
                      onChange={(event) =>
                        updateField(
                          "privacyAcknowledged",
                          event.target.checked,
                        )
                      }
                    />

                    <span className="text-sm leading-6 text-zinc-400">
                      I acknowledge that I have reviewed the preliminary
                      research information and understand that personal
                      information submitted through this form will be handled
                      according to the applicable WPAG privacy notice,
                      research-governance requirements, and local legal
                      obligations. *
                    </span>
                  </label>

                  <FieldError
                    message={fieldErrors.privacyAcknowledged}
                  />
                </section>

                {generalError ? (
                  <div
                    className="mt-10 border border-red-900 bg-red-950/20 p-5 text-sm leading-6 text-red-200"
                    role="alert"
                  >
                    {generalError}
                  </div>
                ) : null}

                <FieldError message={fieldErrors.request} />

                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex min-h-12 items-center justify-center bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-500"
                  >
                    {isSubmitting
                      ? "Submitting Application..."
                      : "Submit Preliminary Application"}
                  </button>

                  <Button href="/participant/eligibility" variant="secondary">
                    Return to Eligibility
                  </Button>
                </div>
              </form>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
