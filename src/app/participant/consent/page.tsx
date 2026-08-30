"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import consent from "@/lib/consent/consent-presentation-v0.2.json";
import {
  type CapacityDecision,
  type ConsentDecision,
  mayContinueConsent,
} from "@/lib/consent/consent-form-policy";


const initialAcknowledgements = Object.fromEntries(
  consent.acknowledgements.map((item) => [item, false]),
) as Record<string, boolean>;

function Choice({ checked, label, name, onChange, value }: {
  checked: boolean;
  label: string;
  name: string;
  onChange: () => void;
  value: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 border border-black/20 p-4 text-sm leading-6 hover:border-black">
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="mt-1 h-4 w-4 accent-black" />
      <span>{label}</span>
    </label>
  );
}

export default function ConsentPage() {
  const router = useRouter();
  const [acknowledgements, setAcknowledgements] = useState(initialAcknowledgements);
  const [ageAndDirectDecision, setAgeAndDirectDecision] = useState(false);
  const [capacityDecision, setCapacityDecision] = useState<CapacityDecision>("");
  const [baselineDecision, setBaselineDecision] = useState<ConsentDecision>("");
  const [followUpDecision, setFollowUpDecision] = useState<ConsentDecision>("");
  const [validationMessage, setValidationMessage] = useState("");

  const mayContinue = mayContinueConsent({
    ageAndDirectDecision,
    capacityDecision,
    acknowledgements,
    baselineDecision,
    followUpDecision,
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mayContinue) {
      setValidationMessage("Consent cannot proceed unless every required acknowledgement and decision is recorded and the eligibility requirements are confirmed.");
      return;
    }
    // Synthetic-only presentation: no consent, participant, or audit record is written.
    router.push("/participant/enrollment-confirmation");
  }

  return (
    <main className="min-h-screen bg-[#f4f2ed] text-black">
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 lg:px-12 lg:py-16">
        <header className="border-b border-black pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/55">Wealth Path AI Global · Controlled research flow</p>
          <h1 className="mt-5 font-serif text-5xl tracking-[-0.04em] sm:text-6xl">{consent.title}</h1>
          <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.14em]">
            <span className="border border-black px-3 py-2">Version {consent.version}</span>
            <span className="border border-red-800 bg-red-50 px-3 py-2 text-red-900">Synthetic/test identities only · Release gate blocked</span>
          </div>
        </header>

        <section className="py-10 lg:py-14">
          <div className="grid gap-5 sm:grid-cols-2">
            {consent.sections.map((section) => (
              <article key={section.heading} className="border border-black/20 bg-white/35 p-6 sm:p-8">
                <h2 className="font-serif text-2xl tracking-[-0.02em]">{section.heading}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-4 text-sm leading-7 text-black/70">{paragraph}</p>)}
              </article>
            ))}
          </div>
        </section>

        <form onSubmit={handleSubmit} noValidate className="border-t border-black">
          <section className="py-10 lg:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Eligibility · fail closed</p>
            <h2 className="mt-4 font-serif text-3xl">Required eligibility confirmations</h2>
            <label className="mt-6 flex cursor-pointer items-start gap-4 border border-black/25 p-5 sm:p-6">
              <input type="checkbox" checked={ageAndDirectDecision} onChange={(event) => { setAgeAndDirectDecision(event.target.checked); setValidationMessage(""); }} className="mt-1 h-5 w-5 accent-black" />
              <span className="text-sm leading-7">{consent.ageAndDirectDecisionConfirmation}</span>
            </label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Choice name="capacity" value="confirmed" checked={capacityDecision === "confirmed"} onChange={() => { setCapacityDecision("confirmed"); setValidationMessage(""); }} label={consent.capacityConfirmation} />
              <Choice name="capacity" value="uncertain" checked={capacityDecision === "uncertain"} onChange={() => setCapacityDecision("uncertain")} label="Uncertain — contact the Privacy/Grievance Contact before making a decision." />
            </div>
            {capacityDecision === "uncertain" && (
              <div role="alert" className="mt-4 border border-red-800 bg-red-50 p-5 text-sm leading-7 text-red-900">
                Questions, clarification requests, consent decisions, withdrawal requests, and complaints should be directed to Srinivas Goud, Founder and Privacy/Grievance Contact, Wealth Path AI Global, at contact@wealthpathaiglobal.com.
              </div>
            )}
          </section>

          <section className="border-t border-black py-10 lg:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Required acknowledgements</p>
            <h2 className="mt-4 font-serif text-3xl">Record each understanding</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {consent.acknowledgements.map((acknowledgement) => (
                <label key={acknowledgement} className="flex cursor-pointer items-start gap-4 border border-black/20 p-5 text-sm leading-7">
                  <input type="checkbox" checked={acknowledgements[acknowledgement]} onChange={(event) => { setAcknowledgements((current) => ({ ...current, [acknowledgement]: event.target.checked })); setValidationMessage(""); }} className="mt-1 h-5 w-5 accent-black" />
                  <span>{acknowledgement}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="border-t border-black py-10 lg:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Separate scope decisions</p>
            <div className="mt-6 grid gap-8 lg:grid-cols-2">
              <fieldset>
                <legend className="font-serif text-2xl">{consent.baselineDecision}</legend>
                <div className="mt-4 grid gap-3">
                  <Choice name="baseline" value="granted" checked={baselineDecision === "granted"} onChange={() => setBaselineDecision("granted")} label="Grant" />
                  <Choice name="baseline" value="declined" checked={baselineDecision === "declined"} onChange={() => setBaselineDecision("declined")} label="Decline" />
                </div>
              </fieldset>
              <fieldset>
                <legend className="font-serif text-2xl">{consent.followUpDecision}</legend>
                <div className="mt-4 grid gap-3">
                  <Choice name="follow-up" value="granted" checked={followUpDecision === "granted"} onChange={() => setFollowUpDecision("granted")} label="Grant" />
                  <Choice name="follow-up" value="declined" checked={followUpDecision === "declined"} onChange={() => setFollowUpDecision("declined")} label="Decline" />
                </div>
              </fieldset>
            </div>
          </section>

          {validationMessage && <div role="alert" className="border border-red-800 bg-red-50 p-5 text-sm leading-7 text-red-900">{validationMessage}</div>}

          <section className="border-t border-black py-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => router.push("/participant/identity-verification")} className="min-h-14 border border-black px-7 text-sm font-semibold uppercase tracking-[0.14em] hover:bg-black hover:text-white">Return to Identity Verification</button>
              <button type="submit" disabled={!mayContinue} className="min-h-14 bg-black px-8 text-sm font-semibold uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-35">Continue synthetic verification</button>
            </div>
            <p className="mt-6 text-xs leading-6 text-black/55">No production consent record, participant record, acceptance timestamp, signature, or audit record is created by this synthetic-only presentation.</p>
          </section>
        </form>
      </div>
    </main>
  );
}
