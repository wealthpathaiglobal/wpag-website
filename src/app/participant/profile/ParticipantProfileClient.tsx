"use client";

import { useMemo, useRef, useState } from "react";
import type { CurrentParticipant } from "@/lib/types/participant/current-participant";
import type {
  CurrentParticipantProfile,
  ParticipantProfileActionResult,
  ParticipantProfileDraftInput,
  ParticipantProfileFieldErrors,
} from "@/lib/types/participant/participant-profile";

type Props = { participant: CurrentParticipant; initialProfile: CurrentParticipantProfile };

const required: (keyof ParticipantProfileDraftInput)[] = [
  "firstName", "lastName", "dateOfBirth", "gender", "maritalStatus",
  "phoneCountryCode", "phoneNumber", "countryCode", "state", "city",
  "postalCode", "employmentStatus", "householdSize", "dependents",
  "emergencyContactName", "emergencyContactRelationship", "emergencyContactPhone",
];

function draftOf(profile: CurrentParticipantProfile): ParticipantProfileDraftInput {
  const { email: _email, profileCompleted: _complete,
    profileCompletedAt: _completeAt, updatedAt: _updatedAt, ...draft } = profile;
  void _email;
  void _complete;
  void _completeAt;
  void _updatedAt;
  return draft;
}

function Field({ label, name, value, onChange, error, helper, type = "text", required: isRequired = false, readOnly = false }: {
  label: string; name: string; value: string | number; onChange?: (value: string) => void;
  error?: string; helper?: string; type?: string; required?: boolean; readOnly?: boolean;
}) {
  const describedBy = [helper ? `${name}-helper` : null, error ? `${name}-error` : null].filter(Boolean).join(" ") || undefined;
  return <div>
    <label htmlFor={name} className="block text-sm font-medium text-black">{label}{isRequired ? " *" : ""}</label>
    <input id={name} name={name} type={type} value={value} readOnly={readOnly}
      onChange={(event) => onChange?.(event.target.value)}
      aria-invalid={Boolean(error)} aria-describedby={describedBy}
      className="mt-2 w-full border border-black/30 bg-white/50 px-4 py-3 outline-none focus-visible:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 read-only:bg-black/5" />
    {helper && <p id={`${name}-helper`} className="mt-2 text-xs leading-5 text-black/55">{helper}</p>}
    {error && <p id={`${name}-error`} role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </div>;
}

function SelectField({ label, name, value, options, onChange, error, helper }: {
  label: string; name: string; value: string; options: readonly (readonly [string, string])[];
  onChange: (value: string) => void; error?: string; helper?: string;
}) {
  return <div><label htmlFor={name} className="block text-sm font-medium">{label} *</label>
    <select id={name} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={[helper ? `${name}-helper` : null, error ? `${name}-error` : null].filter(Boolean).join(" ") || undefined}
      className="mt-2 w-full border border-black/30 bg-white/50 px-4 py-3 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2">
      <option value="">Select</option>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}
    </select>{helper && <p id={`${name}-helper`} className="mt-2 text-xs leading-5 text-black/55">{helper}</p>}{error && <p id={`${name}-error`} role="alert" className="mt-2 text-sm text-red-700">{error}</p>}</div>;
}

export default function ParticipantProfileClient({ participant, initialProfile }: Props) {
  const [durableProfile, setDurableProfile] = useState(initialProfile);
  const [form, setForm] = useState(() => draftOf(initialProfile));
  const [fieldErrors, setFieldErrors] = useState<ParticipantProfileFieldErrors>({});
  const [message, setMessage] = useState("");
  const [submissionKind, setSubmissionKind] = useState<"save" | "complete" | null>(null);
  const submissionLock = useRef(false);

  const completedCount = useMemo(() => required.filter((field) => {
    const value = form[field];
    return value !== null && (typeof value !== "string" || value.trim() !== "");
  }).length, [form]);

  function update<K extends keyof ParticipantProfileDraftInput>(field: K, value: ParticipantProfileDraftInput[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setMessage("");
  }

  async function submit(kind: "save" | "complete") {
    if (submissionLock.current) return;
    submissionLock.current = true; setSubmissionKind(kind); setMessage("");
    try {
      const response = await fetch(kind === "save" ? "/api/participant/profile" : "/api/participant/profile/complete", {
        method: kind === "save" ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: kind === "save" ? JSON.stringify(form) : undefined,
      });
      const result = await response.json() as ParticipantProfileActionResult;
      if (!response.ok || !result.success || !result.profile) {
        setFieldErrors(result.fieldErrors ?? {});
        setMessage(result.formError ?? "The profile could not be updated. Please try again.");
        return;
      }
      setDurableProfile(result.profile); setForm(draftOf(result.profile)); setFieldErrors({});
      setMessage(kind === "save" ? "Draft saved. You can safely return later." : "Profile completed successfully.");
    } catch { setMessage("The profile could not be updated. Please try again."); }
    finally { submissionLock.current = false; setSubmissionKind(null); }
  }

  const input = (field: keyof ParticipantProfileDraftInput) => (value: string) => {
    if (field === "householdSize" || field === "dependents") update(field, value === "" ? null : Number(value));
    else update(field, value as never);
  };
  const genderOptions = [["female", "Female"], ["male", "Male"], ["other", "Other"], ["prefer_not_to_say", "Prefer not to say"]] as const;
  const maritalOptions = [["single", "Single"], ["married", "Married"], ["divorced", "Divorced"], ["widowed", "Widowed"], ["separated", "Separated"], ["other", "Other"], ["prefer_not_to_say", "Prefer not to say"]] as const;
  const employmentOptions = [["employed", "Employed"], ["self_employed", "Self-employed"], ["business_owner", "Business owner"], ["student", "Student"], ["homemaker", "Homemaker"], ["retired", "Retired"], ["unemployed", "Unemployed"], ["other", "Other"]] as const;
  const updated = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(durableProfile.updatedAt));
  const completedAt = durableProfile.profileCompletedAt
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(durableProfile.profileCompletedAt))
    : null;
  const progress = Math.round((completedCount / required.length) * 100);

  return <main className="min-h-screen bg-[#f4f2ed] text-black">
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:py-16">
      <header className="border-b border-black pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-black/55">Wealth Path AI Global · Participant Portal</p>
        <h1 className="mt-5 font-serif text-5xl tracking-[-0.04em]">Participant profile</h1>
        <p className="mt-5 max-w-3xl leading-7 text-black/65">Add your details section by section. Save Progress keeps an incomplete draft. Complete Profile is a separate confirmation that all required profile information is present; it does not complete enrollment.</p>
      </header>

      <section className="my-8 grid gap-4 border border-black bg-black p-6 text-white sm:grid-cols-3">
        <div><p className="text-xs uppercase tracking-widest text-white/55">Status</p><p className="mt-2 text-lg">{durableProfile.profileCompleted ? "Profile complete" : message.startsWith("Draft saved") ? "Draft saved" : "Profile incomplete"}</p>{completedAt && <p className="mt-1 text-sm text-white/65">Completed {completedAt}</p>}</div>
        <div><p className="text-xs uppercase tracking-widest text-white/55">Required fields</p><p className="mt-2 text-lg">{completedCount} of {required.length}</p></div>
        <div><p className="text-xs uppercase tracking-widest text-white/55">Last updated</p><p className="mt-2 text-lg">{updated}</p></div>
      </section>

      <section className="mb-10" aria-labelledby="profile-progress-title">
        <div className="flex items-end justify-between gap-4">
          <div><h2 id="profile-progress-title" className="font-serif text-3xl">Your progress</h2><p className="mt-2 text-sm text-black/60">{completedCount} of {required.length} required fields completed</p></div>
          <p className="text-2xl font-semibold">{progress}%</p>
        </div>
        <div className="mt-4 h-3 border border-black bg-white" role="progressbar" aria-label="Required profile fields completed" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <div className="h-full bg-black transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      </section>

      <form onSubmit={(event) => { event.preventDefault(); void submit("save"); }} className="space-y-12" noValidate aria-busy={submissionKind !== null}>
        <section aria-labelledby="identity-heading"><h2 id="identity-heading" className="font-serif text-3xl">1. Identity and personal details</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-black/60">Tell us how to identify and address you. Fields marked with an asterisk are required to complete the profile.</p><div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Field label="First name" name="firstName" value={form.firstName} onChange={input("firstName")} error={fieldErrors.firstName} required />
          <Field label="Middle name" name="middleName" value={form.middleName} onChange={input("middleName")} />
          <Field label="Last name" name="lastName" value={form.lastName} onChange={input("lastName")} error={fieldErrors.lastName} required />
          <Field label="Preferred name" name="preferredName" value={form.preferredName} onChange={input("preferredName")} />
          <Field label="Date of birth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={input("dateOfBirth")} error={fieldErrors.dateOfBirth} helper="Used to maintain an accurate participant identity record." required />
          <SelectField label="Gender" name="gender" value={form.gender} options={genderOptions} onChange={input("gender")} error={fieldErrors.gender} helper="Choose the option that best reflects how you want this recorded." />
          <SelectField label="Marital status" name="maritalStatus" value={form.maritalStatus} options={maritalOptions} onChange={input("maritalStatus")} error={fieldErrors.maritalStatus} helper="Used as part of your household context." />
          <Field label="Email (managed through your account)" name="email" type="email" value={durableProfile.email ?? ""} readOnly />
        </div></section>

        <section aria-labelledby="contact-heading"><h2 id="contact-heading" className="font-serif text-3xl">2. Contact and address</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-black/60">Provide the contact and location details associated with your participant profile.</p><div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Field label="Phone country code" name="phoneCountryCode" value={form.phoneCountryCode} onChange={input("phoneCountryCode")} error={fieldErrors.phoneCountryCode} required />
          <Field label="Phone number" name="phoneNumber" type="tel" value={form.phoneNumber} onChange={input("phoneNumber")} error={fieldErrors.phoneNumber} required />
          <Field label="Country code" name="countryCode" value={form.countryCode} onChange={input("countryCode")} error={fieldErrors.countryCode} required />
          <Field label="State or province" name="state" value={form.state} onChange={input("state")} error={fieldErrors.state} required />
          <Field label="District" name="district" value={form.district} onChange={input("district")} />
          <Field label="City" name="city" value={form.city} onChange={input("city")} error={fieldErrors.city} required />
          <Field label="Postal code" name="postalCode" value={form.postalCode} onChange={input("postalCode")} error={fieldErrors.postalCode} required />
        </div></section>

        <section aria-labelledby="context-heading"><h2 id="context-heading" className="font-serif text-3xl">3. Education, employment, and household</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-black/60">These details describe your current personal and household context. They do not determine enrollment by themselves.</p><div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Field label="Education level" name="educationLevel" value={form.educationLevel} onChange={input("educationLevel")} />
          <Field label="Occupation" name="occupation" value={form.occupation} onChange={input("occupation")} />
          <SelectField label="Employment status" name="employmentStatus" value={form.employmentStatus} options={employmentOptions} onChange={input("employmentStatus")} error={fieldErrors.employmentStatus} />
          <Field label="Household members" name="householdSize" type="number" value={form.householdSize ?? ""} onChange={input("householdSize")} error={fieldErrors.householdSize} helper="Include the people who are part of your household." required />
          <Field label="Financial dependants" name="dependents" type="number" value={form.dependents ?? ""} onChange={input("dependents")} error={fieldErrors.dependents} helper="Enter the number of people who currently depend on you financially." required />
        </div></section>

        <section aria-labelledby="emergency-heading"><h2 id="emergency-heading" className="font-serif text-3xl">4. Emergency contact</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-black/60">Provide someone WPAG could contact if an urgent participant-related situation requires it.</p><div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Field label="Contact name" name="emergencyContactName" value={form.emergencyContactName} onChange={input("emergencyContactName")} error={fieldErrors.emergencyContactName} helper="Use the name this person would recognize." required />
          <Field label="Relationship" name="emergencyContactRelationship" value={form.emergencyContactRelationship} onChange={input("emergencyContactRelationship")} error={fieldErrors.emergencyContactRelationship} required />
          <Field label="Phone in international format" name="emergencyContactPhone" type="tel" value={form.emergencyContactPhone} onChange={input("emergencyContactPhone")} error={fieldErrors.emergencyContactPhone} required />
        </div></section>

        {message && <p role="status" aria-live="polite" className="border border-black p-4">{message}</p>}
        {Object.keys(fieldErrors).length > 0 && <p className="text-sm text-red-700">Review the highlighted fields before continuing.</p>}
        <div className="grid gap-4 border-t border-black pt-8 sm:grid-cols-2">
          <div className="border border-black/20 p-5"><h2 className="font-serif text-2xl">Not finished yet?</h2><p className="mt-2 text-sm leading-6 text-black/60">Save the information entered so far and return later.</p><button type="submit" disabled={submissionKind !== null} aria-busy={submissionKind === "save"} className="mt-5 min-h-12 w-full border border-black px-6 py-3 font-semibold transition hover:bg-black hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black disabled:cursor-wait disabled:opacity-50 active:translate-y-px">{submissionKind === "save" ? "Saving progress…" : "Save Progress"}</button></div>
          <div className="border border-black bg-black p-5 text-white"><h2 className="font-serif text-2xl">All required details ready?</h2><p className="mt-2 text-sm leading-6 text-white/70">Confirm profile completion. This does not complete participant enrollment.</p><button type="button" disabled={submissionKind !== null} aria-busy={submissionKind === "complete"} onClick={() => void submit("complete")} className="mt-5 min-h-12 w-full bg-white px-6 py-3 font-semibold text-black transition hover:bg-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-wait disabled:opacity-50 active:translate-y-px">{submissionKind === "complete" ? "Completing profile…" : "Complete Profile"}</button></div>
        </div>
        <p className="sr-only" role="status" aria-live="polite">{submissionKind === "save" ? "Profile save in progress." : submissionKind === "complete" ? "Profile completion in progress." : ""}</p>
        <p className="text-sm text-black/55">Participant {participant.participant_code} · {participant.lifecycle_status.replaceAll("_", " ")}</p>
      </form>
    </div>
  </main>;
}
