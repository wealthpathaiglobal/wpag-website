export const controlledResearchConsentPresentation = {
  version: "HFOS-W4-PARTICIPANT-RESEARCH-CONSENT-v0.1",
  sha256: "a8fedbe933d893fd7bbdf31c1b2351a49508cb83c660dac88fda3852ae93f744",
  authorityVersion: "HFOS_Research_Consent_and_Withdrawal_Authority_v0.2",
  reviewDecision: "APPROVED_WITH_NON_BLOCKING_GOVERNANCE_NOTES",
} as const;

export default function ControlledResearchConsentPresentation() {
  return (
    <section className="mt-8 border border-black p-6" aria-labelledby="controlled-research-consent-title">
      <p className="text-xs font-semibold uppercase tracking-[0.2em]">Controlled participant research consent</p>
      <h2 id="controlled-research-consent-title" className="mt-3 font-serif text-3xl">HFOS Wave 4 Participant Research Consent Presentation v0.1</h2>
      <dl className="mt-5 grid gap-3 text-xs sm:grid-cols-2">
        <div><dt className="font-semibold">Controlled version</dt><dd className="mt-1 break-words">{controlledResearchConsentPresentation.version}</dd></div>
        <div><dt className="font-semibold">Controlled SHA-256</dt><dd className="mt-1 break-all">{controlledResearchConsentPresentation.sha256}</dd></div>
      </dl>

      <div className="mt-8 space-y-7 text-sm leading-7">
        <section><h3 className="font-serif text-2xl">Research purpose</h3><p className="mt-2">Wealth Path AI Global is studying how submitted financial facts and later observations may support development and evaluation of the Human Financial Operating System research framework. This is research activity only. It is not a final System State, diagnosis, financial advice, treatment, transition instruction, or execution instruction.</p></section>
        <section><h3 className="font-serif text-2xl">Voluntary participation</h3><p className="mt-2">Taking part is voluntary. You may decline before research participation begins. You may ask questions or request clarification before making a decision. Declining or withdrawing must not be represented as a negative research outcome.</p></section>
        <section><h3 className="font-serif text-2xl">Direct-consent-only scope</h3><p className="mt-2">This controlled research flow supports only a participant deciding directly for themselves. Consent by a representative, consent for a minor, and other representative-consent cases are not supported by this version and require separate authority.</p></section>
        <section><h3 className="font-serif text-2xl">Baseline family and evidence scope</h3><p className="mt-2">The current research family is FSH. If you grant baseline consent, the authorized synthetic scope is limited to the governed FSH baseline research plan and the evidence categories expressly bound to that plan. Consent does not authorize unrelated research families, unrestricted evidence, public case studies, external sharing, or future use merely because it may be useful.</p></section>
        <section><h3 className="font-serif text-2xl">Follow-up scope is separate</h3><p className="mt-2">Baseline consent does not imply follow-up consent. Follow-up research may proceed only if you separately grant the follow-up scope, the current consent and privacy gates remain open, no withdrawal or restriction controls, and an authorized administrator initiates the governed manual follow-up. No automatic cadence is promised or authorized.</p></section>
        <section><h3 className="font-serif text-2xl">Privacy and data use</h3><p className="mt-2">Research information is restricted to approved research purposes, governed roles, and controlled synthetic/test environments for this implementation wave. External sharing, public case studies, advertising, unrelated profiling, and sending participant research data to ChatGPT, Codex, Lovable, another AI system, or an unapproved analytics provider remain prohibited. Legal and jurisdiction-specific privacy questions remain subject to separate review.</p></section>
        <section><h3 className="font-serif text-2xl">Withdrawal and disposition</h3><p className="mt-2">You may submit an explicit research withdrawal request through the participant research page. Protection begins immediately: new research collection and governed follow-up are blocked. Withdrawal does not automatically mean deletion. Existing evidence, derived records, immutable Audit history, retention, restriction, and disposition remain governed by the approved withdrawal/privacy framework and unresolved legal dependencies. There is no silent reactivation.</p></section>
        <section><h3 className="font-serif text-2xl">Results and limitations</h3><p className="mt-2">This research flow does not provide Stable, Under Pressure, or Fragile classifications; candidate thresholds; STRESS predicate conclusions; internal hypotheses; Incident details; or FSH values or interpretations to participants. It makes no Pilot, Production, validation, representativeness, causal, or guaranteed-outcome claim.</p></section>
        <section><h3 className="font-serif text-2xl">Contact and requests</h3><p className="mt-2">Questions, clarification requests, consent decisions, and withdrawal requests must use the authenticated participant pathway or the controlled WPAG contact pathway. This wording does not create statutory rights or legal promises beyond separately approved authority.</p></section>
        <section>
          <h3 className="font-serif text-2xl">Required acknowledgements</h3>
          <p className="mt-2">The participant decision must explicitly record:</p>
          <ol className="mt-2 list-decimal space-y-1 pl-6">
            <li>direct-consent-only eligibility;</li><li>research-purpose understanding;</li><li>voluntary-participation understanding;</li><li>research-only and no-final-State limitation;</li><li>privacy/data-use boundary understanding;</li><li>withdrawal-without-automatic-deletion understanding;</li><li>baseline FSH scope decision; and</li><li>a separate follow-up scope decision.</li>
          </ol>
        </section>
        <section><h3 className="font-serif text-2xl">Activation boundary</h3><p className="mt-2">This creation-side artifact may be exercised only with synthetic/test identities for deterministic verification. Until an independent governance review approves the exact wording and a later release review closes every remaining dependency:</p><ul className="mt-2 space-y-1 font-mono text-xs"><li>REAL PARTICIPANT CONSENT PRESENTATION: BLOCKED</li><li>REAL PARTICIPANT EVIDENCE COLLECTION: NOT AUTHORIZED</li><li>ACTUAL PARTICIPANT ENROLLMENT: NOT AUTHORIZED</li><li>SOFT_LAUNCH_RELEASE_GATE: BLOCKED</li><li>PILOT: NOT AUTHORIZED</li><li>PRODUCTION: NOT AUTHORIZED</li></ul></section>
      </div>
    </section>
  );
}
