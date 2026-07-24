"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ProfileForm = {
  fullName: string;
  preferredName: string;
  dateOfBirth: string;
  country: string;
  email: string;
  mobile: string;
  preferredContactMethod: "email" | "mobile";
  preferredLanguage: string;
  occupation: string;
  city: string;
};

type ProfileErrors = Partial<Record<keyof ProfileForm, string>>;

const initialProfile: ProfileForm = {
  fullName: "",
  preferredName: "",
  dateOfBirth: "",
  country: "",
  email: "",
  mobile: "",
  preferredContactMethod: "email",
  preferredLanguage: "English",
  occupation: "",
  city: "",
};

function StatusRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-2 border-b border-black/10 py-4 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center">
      <span className="text-sm leading-6 text-black/60">{label}</span>

      <span className="text-sm font-medium leading-6 text-black">
        {value}
      </span>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 text-sm leading-6 text-red-700" role="alert">
      {message}
    </p>
  );
}

export default function ParticipantProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileForm>(initialProfile);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isPrototypeComplete, setIsPrototypeComplete] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const completedFields = useMemo(() => {
    return [
      profile.fullName,
      profile.dateOfBirth,
      profile.country,
      profile.email,
      profile.mobile,
      profile.preferredLanguage,
      profile.occupation,
      profile.city,
    ].filter((value) => value.trim().length > 0).length;
  }, [profile]);

  const profileCompletion = Math.round((completedFields / 8) * 100);

  function updateField<K extends keyof ProfileForm>(
    field: K,
    value: ProfileForm[K],
  ) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
    }

    if (successMessage) {
      setSuccessMessage("");
    }

    if (isPrototypeComplete) {
      setIsPrototypeComplete(false);
    }
  }

  function validateProfile() {
    const nextErrors: ProfileErrors = {};

    if (!profile.fullName.trim()) {
      nextErrors.fullName = "Enter the participant's full legal name.";
    }

    if (!profile.dateOfBirth) {
      nextErrors.dateOfBirth = "Enter the participant's date of birth.";
    } else {
      const selectedDate = new Date(`${profile.dateOfBirth}T00:00:00`);
      const today = new Date();

      if (selectedDate > today) {
        nextErrors.dateOfBirth =
          "The date of birth cannot be in the future.";
      }
    }

    if (!profile.country.trim()) {
      nextErrors.country = "Enter the participant's country.";
    }

    if (!profile.email.trim()) {
      nextErrors.email = "Enter a contact email address.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())
    ) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!profile.mobile.trim()) {
      nextErrors.mobile = "Enter a contact mobile number.";
    } else if (!/^[0-9+\-\s()]{7,20}$/.test(profile.mobile.trim())) {
      nextErrors.mobile = "Enter a valid mobile number.";
    }

    if (!profile.preferredLanguage.trim()) {
      nextErrors.preferredLanguage =
        "Enter the preferred communication language.";
    }

    if (!profile.occupation.trim()) {
      nextErrors.occupation = "Enter the participant's occupation.";
    }

    if (!profile.city.trim()) {
      nextErrors.city = "Enter the participant's city or region.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateProfile()) {
      setSuccessMessage("");
      return;
    }

    setIsSaving(true);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 700);
    });

    setIsSaving(false);
    setIsPrototypeComplete(true);
    setSuccessMessage(
      "Prototype profile completed for this browser session. No data has been stored.",
    );
  }

  function handleReturn() {
    router.push("/participant/dashboard");
  }

  function handleContinue() {
    router.push("/participant/assessment");
  }

  return (
    <main className="min-h-screen bg-[#f4f2ed] text-black">
      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
        <header className="border-b border-black pb-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-black/55">
                Wealth Path AI Global
              </p>

              <p className="mt-3 text-sm uppercase tracking-[0.18em] text-black/60">
                Participant Portal · Profile
              </p>
            </div>

            <p className="max-w-sm text-sm leading-6 text-black/55 sm:text-right">
              Institutional participant workspace prototype
            </p>
          </div>
        </header>

        <section className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-16 lg:py-20">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-black/55">
              Participant profile
            </p>

            <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Build your participant profile.
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-black/65 sm:text-lg">
              Review and complete the information that will support
              participant communication, programme administration, research
              activity, and follow-up.
            </p>
          </div>

          <aside className="border border-black bg-black p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
              Prototype notice
            </p>

            <p className="mt-5 text-sm leading-7 text-white/80">
              This page does not retrieve or store participant information.
              Values entered here remain in the current page session only.
            </p>

            <p className="mt-4 text-sm leading-7 text-white/80">
              Production profiles will require authentication, encrypted
              storage, access controls, change history, consent linkage, and
              institutional audit records.
            </p>
          </aside>
        </section>

        <form onSubmit={handleSave} noValidate>
          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/50">
                  01
                </p>

                <h2 className="mt-4 font-serif text-3xl tracking-[-0.025em] sm:text-4xl">
                  Personal information
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Enter the participant's basic identity and location
                  information.
                </p>
              </div>

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <div className="grid gap-7">
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-medium text-black"
                    >
                      Full legal name
                    </label>

                    <input
                      id="fullName"
                      type="text"
                      autoComplete="name"
                      value={profile.fullName}
                      onChange={(event) =>
                        updateField("fullName", event.target.value)
                      }
                      className="mt-3 w-full border border-black/30 bg-transparent px-4 py-4 text-base outline-none transition placeholder:text-black/30 focus:border-black"
                      placeholder="Enter full legal name"
                    />

                    <FieldError message={errors.fullName} />
                  </div>

                  <div>
                    <label
                      htmlFor="preferredName"
                      className="block text-sm font-medium text-black"
                    >
                      Preferred name
                    </label>

                    <p className="mt-1 text-xs leading-5 text-black/50">
                      Optional name used in participant communications.
                    </p>

                    <input
                      id="preferredName"
                      type="text"
                      value={profile.preferredName}
                      onChange={(event) =>
                        updateField("preferredName", event.target.value)
                      }
                      className="mt-3 w-full border border-black/30 bg-transparent px-4 py-4 text-base outline-none transition placeholder:text-black/30 focus:border-black"
                      placeholder="Enter preferred name"
                    />
                  </div>

                  <div className="grid gap-7 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="dateOfBirth"
                        className="block text-sm font-medium text-black"
                      >
                        Date of birth
                      </label>

                      <input
                        id="dateOfBirth"
                        type="date"
                        autoComplete="bday"
                        value={profile.dateOfBirth}
                        onChange={(event) =>
                          updateField("dateOfBirth", event.target.value)
                        }
                        className="mt-3 w-full border border-black/30 bg-transparent px-4 py-4 text-base outline-none transition focus:border-black"
                      />

                      <FieldError message={errors.dateOfBirth} />
                    </div>

                    <div>
                      <label
                        htmlFor="country"
                        className="block text-sm font-medium text-black"
                      >
                        Country or territory
                      </label>

                      <input
                        id="country"
                        type="text"
                        autoComplete="country-name"
                        value={profile.country}
                        onChange={(event) =>
                          updateField("country", event.target.value)
                        }
                        className="mt-3 w-full border border-black/30 bg-transparent px-4 py-4 text-base outline-none transition placeholder:text-black/30 focus:border-black"
                        placeholder="Enter country"
                      />

                      <FieldError message={errors.country} />
                    </div>
                  </div>

                  <div className="grid gap-7 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="city"
                        className="block text-sm font-medium text-black"
                      >
                        City or region
                      </label>

                      <input
                        id="city"
                        type="text"
                        autoComplete="address-level2"
                        value={profile.city}
                        onChange={(event) =>
                          updateField("city", event.target.value)
                        }
                        className="mt-3 w-full border border-black/30 bg-transparent px-4 py-4 text-base outline-none transition placeholder:text-black/30 focus:border-black"
                        placeholder="Enter city or region"
                      />

                      <FieldError message={errors.city} />
                    </div>

                    <div>
                      <label
                        htmlFor="occupation"
                        className="block text-sm font-medium text-black"
                      >
                        Occupation
                      </label>

                      <input
                        id="occupation"
                        type="text"
                        autoComplete="organization-title"
                        value={profile.occupation}
                        onChange={(event) =>
                          updateField("occupation", event.target.value)
                        }
                        className="mt-3 w-full border border-black/30 bg-transparent px-4 py-4 text-base outline-none transition placeholder:text-black/30 focus:border-black"
                        placeholder="Enter occupation"
                      />

                      <FieldError message={errors.occupation} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/50">
                  02
                </p>

                <h2 className="mt-4 font-serif text-3xl tracking-[-0.025em] sm:text-4xl">
                  Contact information
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Contact details will support participant verification,
                  notices, follow-ups, and programme communication.
                </p>
              </div>

              <div className="border border-black/20 bg-white/40 p-6 sm:p-8 lg:p-10">
                <div className="grid gap-7">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-black"
                    >
                      Email address
                    </label>

                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={profile.email}
                      onChange={(event) =>
                        updateField("email", event.target.value)
                      }
                      className="mt-3 w-full border border-black/30 bg-transparent px-4 py-4 text-base outline-none transition placeholder:text-black/30 focus:border-black"
                      placeholder="participant@example.com"
                    />

                    <FieldError message={errors.email} />
                  </div>

                  <div>
                    <label
                      htmlFor="mobile"
                      className="block text-sm font-medium text-black"
                    >
                      Mobile number
                    </label>

                    <input
                      id="mobile"
                      type="tel"
                      autoComplete="tel"
                      value={profile.mobile}
                      onChange={(event) =>
                        updateField("mobile", event.target.value)
                      }
                      className="mt-3 w-full border border-black/30 bg-transparent px-4 py-4 text-base outline-none transition placeholder:text-black/30 focus:border-black"
                      placeholder="+91 00000 00000"
                    />

                    <FieldError message={errors.mobile} />
                  </div>

                  <fieldset>
                    <legend className="text-sm font-medium text-black">
                      Preferred contact method
                    </legend>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {[
                        {
                          value: "email" as const,
                          label: "Email",
                        },
                        {
                          value: "mobile" as const,
                          label: "Mobile",
                        },
                      ].map((option) => {
                        const selected =
                          profile.preferredContactMethod === option.value;

                        return (
                          <label
                            key={option.value}
                            className={`flex cursor-pointer items-center justify-between border p-5 transition ${
                              selected
                                ? "border-black bg-black text-white"
                                : "border-black/25 hover:border-black"
                            }`}
                          >
                            <input
                              type="radio"
                              name="preferredContactMethod"
                              value={option.value}
                              checked={selected}
                              onChange={() =>
                                updateField(
                                  "preferredContactMethod",
                                  option.value,
                                )
                              }
                              className="sr-only"
                            />

                            <span className="font-serif text-xl">
                              {option.label}
                            </span>

                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                                selected
                                  ? "border-white"
                                  : "border-black"
                              }`}
                            >
                              {selected && (
                                <span className="h-2.5 w-2.5 rounded-full bg-white" />
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div>
                    <label
                      htmlFor="preferredLanguage"
                      className="block text-sm font-medium text-black"
                    >
                      Preferred communication language
                    </label>

                    <input
                      id="preferredLanguage"
                      type="text"
                      value={profile.preferredLanguage}
                      onChange={(event) =>
                        updateField(
                          "preferredLanguage",
                          event.target.value,
                        )
                      }
                      className="mt-3 w-full border border-black/30 bg-transparent px-4 py-4 text-base outline-none transition placeholder:text-black/30 focus:border-black"
                      placeholder="Enter preferred language"
                    />

                    <FieldError message={errors.preferredLanguage} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/50">
                  03
                </p>

                <h2 className="mt-4 font-serif text-3xl tracking-[-0.025em] sm:text-4xl">
                  Programme information
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  Programme and governance details will be assigned by the
                  institutional administration process.
                </p>
              </div>

              <div className="border border-black/25 px-6 sm:px-8">
                <StatusRow
                  label="Participant identifier"
                  value="Not generated"
                />

                <StatusRow
                  label="Programme assignment"
                  value="Pending approval"
                />

                <StatusRow
                  label="Enrollment status"
                  value="Prototype completed"
                />

                <StatusRow
                  label="Identity verification"
                  value="Prototype only"
                />

                <StatusRow
                  label="Consent status"
                  value="Prototype only"
                />

                <StatusRow
                  label="Participant role"
                  value="Research participant"
                />

                <StatusRow
                  label="Account access"
                  value="Not authenticated"
                />
              </div>
            </div>
          </section>

          <section className="border-t border-black py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/50">
                  04
                </p>

                <h2 className="mt-4 font-serif text-3xl tracking-[-0.025em] sm:text-4xl">
                  Profile status
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
                  This status reflects form completion in the current browser
                  session only.
                </p>
              </div>

              <div>
                <div className="border border-black/25 p-6 sm:p-8">
                  <div className="flex items-end justify-between gap-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                        Profile completion
                      </p>

                      <p className="mt-4 font-serif text-5xl">
                        {profileCompletion}%
                      </p>
                    </div>

                    <p className="text-sm text-black/55">
                      {completedFields} of 8 required fields
                    </p>
                  </div>

                  <div className="mt-7 h-2 w-full bg-black/10">
                    <div
                      className="h-full bg-black transition-all duration-300"
                      style={{
                        width: `${profileCompletion}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4 border border-black/25 px-6 sm:px-8">
                  <StatusRow
                    label="Required profile fields"
                    value={`${completedFields} of 8 completed`}
                  />

                  <StatusRow
                    label="Prototype profile status"
                    value={
                      isPrototypeComplete
                        ? "Completed for current session"
                        : "Awaiting completion"
                    }
                  />

                  <StatusRow
                    label="Database record"
                    value="Not created"
                  />

                  <StatusRow
                    label="Change history"
                    value="Not recorded"
                  />

                  <StatusRow
                    label="Administrative review"
                    value="Not performed"
                  />
                </div>

                {successMessage && (
                  <div
                    className="mt-5 border border-black bg-black p-5 text-sm leading-7 text-white"
                    role="status"
                  >
                    {successMessage}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="border-t border-black py-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <button
                type="button"
                onClick={handleReturn}
                disabled={isSaving}
                className="inline-flex min-h-14 items-center justify-center border border-black px-7 text-sm font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Return to Dashboard
              </button>

              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex min-h-14 items-center justify-center border border-black px-7 text-sm font-semibold uppercase tracking-[0.14em] transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving
                    ? "Saving Profile..."
                    : "Complete Prototype Profile"}
                </button>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!isPrototypeComplete || isSaving}
                  className="inline-flex min-h-14 items-center justify-center bg-black px-8 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Continue to HFOS Assessment
                </button>
              </div>
            </div>

            <p className="mt-8 max-w-4xl text-xs leading-6 text-black/50">
              Production participant profiles will require authenticated
              access, encrypted database storage, participant and
              administrator permissions, version history, consent linkage,
              privacy governance, and complete institutional audit logging.
            </p>
          </section>
        </form>
      </div>
    </main>
  );
}