"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { typography } from "@/styles/typography";
import { Button } from "@/ui/button";

type VerificationMethod = "email" | "mobile";

const inputClassName =
  "min-h-12 w-full border border-zinc-700 bg-black px-4 py-3 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-white";

export default function VerifyContactPage() {
  const router = useRouter();

  const [method, setMethod] = useState<VerificationMethod>("email");
  const [verificationCode, setVerificationCode] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [codeRequested, setCodeRequested] = useState(false);

  const codeIsValid = verificationCode.trim().length === 6;

  function requestVerificationCode() {
    setCodeRequested(true);
    setVerificationCode("");
    setSubmitted(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);

    if (!codeRequested || !codeIsValid) {
      return;
    }

    router.push("/participant/identity-verification");
  }

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-black text-white">
        <section className="py-24">
          <Container>
            <div className="max-w-4xl">
              <p className={`mb-6 ${typography.caption}`}>
                Participant Journey · Step 5
              </p>

              <h1 className={typography.display}>
                Verify contact information.
              </h1>

              <p className={`mt-8 max-w-3xl ${typography.bodyLarge}`}>
                Contact verification helps protect participant access and
                confirms that future research communications are sent through
                an approved channel.
              </p>

              <div className="mt-8 border border-zinc-800 p-6">
                <p className="text-sm leading-6 text-zinc-400">
                  This prototype does not send email, SMS, or verification
                  codes. The controls below demonstrate the intended workflow
                  only. Production verification requires an approved
                  authentication provider, secure code generation, expiry
                  controls, rate limiting, audit logging, and privacy
                  safeguards.
                </p>
              </div>

              <form className="mt-16" onSubmit={handleSubmit}>
                <fieldset>
                  <legend className="text-lg font-semibold text-white">
                    Select verification method
                  </legend>

                  <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-400">
                    Available methods may vary according to the research
                    programme, country or territory, technical availability,
                    accessibility requirements, and participant preference.
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <label
                      className={`cursor-pointer border p-6 transition ${
                        method === "email"
                          ? "border-white bg-white text-black"
                          : "border-zinc-700 bg-black text-white hover:border-zinc-500"
                      }`}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        name="verificationMethod"
                        value="email"
                        checked={method === "email"}
                        onChange={() => {
                          setMethod("email");
                          setCodeRequested(false);
                          setVerificationCode("");
                          setSubmitted(false);
                        }}
                      />

                      <span className="block text-lg font-semibold">
                        Email verification
                      </span>

                      <span
                        className={`mt-3 block text-sm leading-6 ${
                          method === "email"
                            ? "text-zinc-700"
                            : "text-zinc-400"
                        }`}
                      >
                        Verify access through the email address associated with
                        the preliminary application.
                      </span>
                    </label>

                    <label
                      className={`cursor-pointer border p-6 transition ${
                        method === "mobile"
                          ? "border-white bg-white text-black"
                          : "border-zinc-700 bg-black text-white hover:border-zinc-500"
                      }`}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        name="verificationMethod"
                        value="mobile"
                        checked={method === "mobile"}
                        onChange={() => {
                          setMethod("mobile");
                          setCodeRequested(false);
                          setVerificationCode("");
                          setSubmitted(false);
                        }}
                      />

                      <span className="block text-lg font-semibold">
                        Mobile verification
                      </span>

                      <span
                        className={`mt-3 block text-sm leading-6 ${
                          method === "mobile"
                            ? "text-zinc-700"
                            : "text-zinc-400"
                        }`}
                      >
                        Verify access through an internationally formatted
                        mobile number where supported.
                      </span>
                    </label>
                  </div>
                </fieldset>

                <div className="mt-12 border-y border-zinc-800 py-10">
                  <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        {method === "email"
                          ? "Email verification code"
                          : "Mobile verification code"}
                      </h2>

                      <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-400">
                        Request a temporary six-digit verification code. In
                        production, the code will expire after a controlled
                        period and may be subject to retry limits.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={requestVerificationCode}
                      className="inline-flex min-h-12 items-center justify-center border border-zinc-700 px-6 py-3 text-sm font-semibold text-white transition hover:border-white"
                    >
                      {codeRequested
                        ? "Request New Code"
                        : "Request Verification Code"}
                    </button>
                  </div>

                  {codeRequested ? (
                    <div className="mt-8 max-w-md">
                      <label className="block">
                        <span className="text-sm font-semibold text-white">
                          Enter six-digit code
                        </span>

                        <input
                          className={`mt-3 ${inputClassName}`}
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          placeholder="000000"
                          value={verificationCode}
                          onChange={(event) =>
                            setVerificationCode(
                              event.target.value
                                .replace(/\D/g, "")
                                .slice(0, 6),
                            )
                          }
                        />
                      </label>

                      <p className="mt-3 text-sm leading-6 text-zinc-500">
                        Prototype testing: enter any six digits to continue.
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-10 border border-zinc-800 p-6">
                  <h2 className="text-lg font-semibold text-white">
                    Verification status
                  </h2>

                  <dl className="mt-6 grid gap-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm text-zinc-500">
                        Selected method
                      </dt>

                      <dd className="mt-2 font-semibold text-white">
                        {method === "email" ? "Email" : "Mobile"}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm text-zinc-500">
                        Code requested
                      </dt>

                      <dd className="mt-2 font-semibold text-white">
                        {codeRequested ? "Prototype request created" : "No"}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm text-zinc-500">
                        Contact verified
                      </dt>

                      <dd className="mt-2 font-semibold text-white">
                        No production verification recorded
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm text-zinc-500">
                        Data transmitted
                      </dt>

                      <dd className="mt-2 font-semibold text-white">
                        No
                      </dd>
                    </div>
                  </dl>
                </div>

                {submitted && (!codeRequested || !codeIsValid) ? (
                  <div
                    className="mt-8 border border-zinc-700 p-5 text-sm text-zinc-300"
                    role="alert"
                  >
                    Request a verification code and enter all six digits before
                    continuing.
                  </div>
                ) : null}

                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <button
                    type="submit"
                    className="inline-flex min-h-12 items-center justify-center bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
                  >
                    Continue to Identity Review
                  </button>

                  <Button
                    href="/participant/application-submitted"
                    variant="secondary"
                  >
                    Return to Application Next Steps
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