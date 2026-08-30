export type ConsentDecision = "" | "granted" | "declined";
export type CapacityDecision = "" | "confirmed" | "uncertain";

export type ConsentFormState = {
  ageAndDirectDecision: boolean;
  capacityDecision: CapacityDecision;
  acknowledgements: Record<string, boolean>;
  baselineDecision: ConsentDecision;
  followUpDecision: ConsentDecision;
};

export function mayContinueConsent(state: ConsentFormState) {
  const acknowledgementValues = Object.values(state.acknowledgements);
  return (
    state.ageAndDirectDecision &&
    state.capacityDecision === "confirmed" &&
    acknowledgementValues.length > 0 &&
    acknowledgementValues.every(Boolean) &&
    state.baselineDecision === "granted" &&
    state.followUpDecision !== ""
  );
}
