"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { typography } from "@/styles/typography";
import { Button } from "@/ui/button";

type ApplicationForm = {
  givenName: string;
  familyName: string;
  preferredName: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  countryOrTerritory: string;
  timeZone: string;
  preferredLanguage: string;
  dateOfBirth: string;
  privacyAcknowledged: boolean;
};

const initialForm: ApplicationForm = {
  givenName: "",
  familyName: "",
  preferredName: "",
  email: "",
  phoneCountryCode: "",
  phoneNumber: "",
  countryOrTerritory: "",
  timeZone: "",
  preferredLanguage: "",
  dateOfBirth: "",
  privacyAcknowledged: false,
};

const inputClassName =
  "mt-3 min-h-12 w-full border border-zinc-700 bg-black px-4 py-3 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-white";

export default function ParticipantApplicationPage() {
  const router = useRouter();

  const [form, setForm] = useState<ApplicationForm>(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const requiredFieldsCompleted =
    form.givenName.trim() !== "" &&
    form.familyName.trim() !== "" &&
    form.email.trim() !== "" &&
    form.countryOrTerritory.trim() !== "" &&
    form.timeZone.trim() !== "" &&
    form.preferredLanguage.trim() !== "" &&
    form.dateOfBirth !== "" &&
    form.privacyAcknowledged;

  function updateField<K extends keyof ApplicationForm>(
    field: K,
    value: ApplicationForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);

    if (!requiredFieldsCompleted) {
      return;
    }

    router.push("/participant/application-submitted");
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
                Provide the basic information required to submit a preliminary
                application for participation in a Wealth Path AI Global
                research programme.
              </p>

              <div className="mt-8 border border-zinc-800 p-6">
                <p className="text-sm leading-6 text-zinc-400">
                  Submitting this application does not create a participant
                  account, confirm eligibility, record formal informed consent,
                  or guarantee enrollment. Applications remain subject to
                  programme, jurisdictional, identity, privacy, and governance
                  review.
                </p>
              </div>

              <form className="mt-16" onSubmit={handleSubmit} noValidate>
                <div className="grid gap-x-8 gap-y-8 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-white">
                      Given name *
                    </span>

                    <input
                      className={inputClassName}
                      type="text"
                      autoComplete="given-name"
                      value={form.givenName}
                      onChange={(event) =>
                        updateField("givenName", event.target.value)
                      }
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-white">
                      Family name *
                    </span>

                    <input
                      className={inputClassName}
                      type="text"
                      autoComplete="family-name"
                      value={form.familyName}
                      onChange={(event) =>
                        updateField("familyName", event.target.value)
                      }
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-white">
                      Preferred name
                    </span>

                    <input
                      className={inputClassName}
                      type="text"
                      autoComplete="nickname"
                      value={form.preferredName}
                      onChange={(event) =>
                        updateField("preferredName", event.target.value)
                      }
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-white">
                      Email address *
                    </span>

                    <input
                      className={inputClassName}
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(event) =>
                        updateField("email", event.target.value)
                      }
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-white">
                      International calling code
                    </span>

                    <input
                      className={inputClassName}
                      type="text"
                      inputMode="tel"
                      placeholder="+1, +44, +91"
                      value={form.phoneCountryCode}
                      onChange={(event) =>
                        updateField("phoneCountryCode", event.target.value)
                      }
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-white">
                      Mobile or telephone number
                    </span>

                    <input
                      className={inputClassName}
                      type="tel"
                      autoComplete="tel"
                      value={form.phoneNumber}
                      onChange={(event) =>
                        updateField("phoneNumber", event.target.value)
                      }
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-white">
                      Country or territory *
                    </span>

                    <input
                      className={inputClassName}
                      type="text"
                      autoComplete="country-name"
                      value={form.countryOrTerritory}
                      onChange={(event) =>
                        updateField("countryOrTerritory", event.target.value)
                      }
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-white">
                      Time zone *
                    </span>

                    <input
                      className={inputClassName}
                      type="text"
                      placeholder="Example: Europe/London"
                      value={form.timeZone}
                      onChange={(event) =>
                        updateField("timeZone", event.target.value)
                      }
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-white">
                      Preferred communication language *
                    </span>

                    <input
                      className={inputClassName}
                      type="text"
                      value={form.preferredLanguage}
                      onChange={(event) =>
                        updateField("preferredLanguage", event.target.value)
                      }
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-white">
                      Date of birth *
                    </span>

                    <input
                      className={inputClassName}
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(event) =>
                        updateField("dateOfBirth", event.target.value)
                      }
                    />
                  </label>
                </div>

                <label className="mt-10 flex cursor-pointer items-start gap-4 border border-zinc-800 p-6">
                  <input
                    className="mt-1 h-5 w-5 accent-white"
                    type="checkbox"
                    checked={form.privacyAcknowledged}
                    onChange={(event) =>
                      updateField(
                        "privacyAcknowledged",
                        event.target.checked,
                      )
                    }
                  />

                  <span className="text-sm leading-6 text-zinc-400">
                    I acknowledge that I have reviewed the preliminary research
                    information and understand that any personal information
                    submitted must be handled according to the applicable WPAG
                    privacy notice, research-governance requirements, and local
                    legal obligations. *
                  </span>
                </label>

                {submitted && !requiredFieldsCompleted ? (
                  <div
                    className="mt-8 border border-zinc-700 p-5 text-sm text-zinc-300"
                    role="alert"
                  >
                    Complete all required fields and acknowledge the privacy
                    statement before submitting the application.
                  </div>
                ) : null}

                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <button
                    type="submit"
                    className="inline-flex min-h-12 items-center justify-center bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
                  >
                    Submit Preliminary Application
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