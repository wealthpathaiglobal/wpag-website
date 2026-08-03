import type { PreliminaryReportContent } from "@/lib/types/preliminary-report";

const sections: readonly [keyof PreliminaryReportContent, string][] = [
  ["reportPurpose", "Report Purpose"],
  ["participantContext", "Participant Context"],
  ["assessmentContext", "Assessment Context"],
  ["informationBasis", "Information Basis"],
  ["humanReviewSummary", "Human Review Summary"],
  ["reportedFinancialConditions", "Reported Financial Conditions"],
  ["reportedStrengths", "Reported Strengths"],
  ["reportedPressures", "Reported Pressures"],
  ["evidenceStatus", "Evidence Status"],
  ["limitations", "Limitations"],
  ["preliminaryObservations", "Preliminary Observations"],
  ["nextSteps", "Next Steps"],
  ["participantNotice", "Participant Notice"],
];

export default function PreliminaryReportContentView({
  content,
  theme = "light",
}: {
  content: PreliminaryReportContent;
  theme?: "light" | "dark";
}) {
  const dark = theme === "dark";
  return (
    <article className="space-y-6">
      {sections.map(([key, label]) => {
        const value = content[key];
        return (
          <section
            key={key}
            className={`border p-5 sm:p-6 ${dark ? "border-white/10 bg-white/[0.02]" : "border-black/15 bg-white/45"}`}
          >
            <h2 className={`text-xs font-semibold uppercase tracking-[0.18em] ${dark ? "text-white/40" : "text-black/45"}`}>
              {label}
            </h2>
            {Array.isArray(value) ? (
              value.length > 0 ? (
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7">
                  {value.map((item, index) => <li key={`${key}-${index}`}>{item}</li>)}
                </ul>
              ) : <p className={`mt-4 text-sm ${dark ? "text-white/35" : "text-black/40"}`}>Not recorded.</p>
            ) : (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{value || "Not recorded."}</p>
            )}
          </section>
        );
      })}
    </article>
  );
}
