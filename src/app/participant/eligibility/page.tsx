"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { typography } from "@/styles/typography";
import { Button } from "@/ui/button";

type EligibilityAnswer = "yes" | "no" | "";

type EligibilityKey =
  | "minimumAge"
  | "voluntaryParticipation"
  | "informationUnderstanding"
  | "assessmentCapacity"
  | "followUpAvailability";

const questions: Array<{
  id: EligibilityKey;
  title: string;
  description: string;
}> = [
  {
    id: "minimumAge",
    title: "Minimum participation age",
    description:
      "Are you at or above the minimum legal age required for independent research participation in your country or jurisdiction?",
  },
  {
    id: "voluntaryParticipation",
    title: "Voluntary participation",
    description:
      "Are you choosing to participate voluntarily, without pressure or coercion?",
  },
  {
    id: "informationUnderstanding",
    title: "Research information",
    description:
      "Can you understand the research information in an available supported language, with reasonable assistance where required?",
  },
  {
    id: "assessmentCapacity",
    title: "Assessment participation",
    description:
      "Are you able and willing to complete structured assessments and provide information that is accurate to the best of your knowledge?",
  },
  {
    id: "followUpAvailability",
    title: "Longitudinal follow-up",
    description:
      "Are you willing to be contacted for approved follow-up activities during the research period?",
  },
];

const initialAnswers: Record<EligibilityKey, EligibilityAnswer> = {
  minimumAge: "",
  voluntaryParticipation: "",
  informationUnderstanding: "",
  assessmentCapacity: "",
  followUpAvailability: "",
};

export default function ParticipantEligibilityPage() {
  const router = useRouter();

  const [answers, setAnswers] =
    useState<Record<EligibilityKey, EligibilityAnswer>>(initialAnswers);

  const [showValidation, setShowValidation] = useState(false);

  const allAnswered = useMemo(
    () => Object.values(answers).every((answer) => answer !== ""),
    [answers],
  );

  const meetsPreliminaryCriteria = useMemo(
    () => Object.values(answers).every((answer) => answer === "yes"),
    [answers],
  );

  function updateAnswer(id: EligibilityKey, value: EligibilityAnswer) {
    setAnswers((current) => ({
      ...current,
      [id]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowValidation(true);

    if (!allAnswered) {
      return;
    }

    if (meetsPreliminaryCriteria) {
      router.push("/participant/application");
      return;
    }

    router.push("/participant/not-eligible");
  }

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-black text-white">
        <section className="py-24">
          <Container>
            <div className="max-w-4xl">
              <p className={`mb-6 ${typography.caption}`}>
                Participant Journey · Step 2
              </p>

              <h1 className={typography.display}>
                Preliminary eligibility screening.
              </h1>

              <p className={`mt-8 max-w-3xl ${typography.bodyLarge}`}>
                Answer each question to determine whether you may continue to
                the participant application stage. Eligibility requirements may
                vary by research programme and jurisdiction.
              </p>

              <div className="mt-8 border border-zinc-800 p-6">
                <p className="text-sm leading-6 text-zinc-400">
                  This screening does not confirm enrollment. Final eligibility
                  may require identity verification, programme-specific review,
                  informed consent, and governance approval.
                </p>
              </div>

              <form className="mt-16" onSubmit={handleSubmit}>
                <div className="divide-y divide-zinc-800 border-y border-zinc-800">
                  {questions.map((question, index) => {
                    const unanswered =
                      showValidation && answers[question.id] === "";

                    return (
                      <fieldset
                        key={question.id}
                        className="grid gap-6 py-8 md:grid-cols-[1fr_240px]"
                      >
                        <div>
                          <legend className="text-lg font-semibold text-white">
                            {index + 1}. {question.title}
                          </legend>

                          <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-400">
                            {question.description}
                          </p>

                          {unanswered ? (
                            <p className="mt-3 text-sm text-white">
                              Please select an answer.
                            </p>
                          ) : null}
                        </div>

                        <div className="flex gap-3 md:justify-end">
                          {(["yes", "no"] as const).map((value) => {
                            const selected =
                              answers[question.id] === value;

                            return (
                              <label
                                key={value}
                                className={`flex min-w-24 cursor-pointer items-center justify-center border px-5 py-3 text-sm font-semibold transition ${
                                  selected
                                    ? "border-white bg-white text-black"
                                    : "border-zinc-700 bg-black text-white hover:border-zinc-500"
                                }`}
                              >
                                <input
                                  className="sr-only"
                                  type="radio"
                                  name={question.id}
                                  value={value}
                                  checked={selected}
                                  onChange={() =>
                                    updateAnswer(question.id, value)
                                  }
                                />

                                {value === "yes" ? "Yes" : "No"}
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                    );
                  })}
                </div>

                {showValidation && !allAnswered ? (
                  <div
                    className="mt-8 border border-zinc-700 p-5 text-sm text-zinc-300"
                    role="alert"
                  >
                    Complete every screening question before continuing.
                  </div>
                ) : null}

                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <button
                    type="submit"
                    className="inline-flex min-h-12 items-center justify-center bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
                  >
                    Review Eligibility Result
                  </button>

                  <Button href="/participant/consent" variant="secondary">
                    Return to Research Information
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