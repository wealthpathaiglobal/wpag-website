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

function Field({ label, name, value, onChange, error, type = "text", required: isRequired = false, readOnly = false }: {
  label: string; name: string; value: string | number; onChange?: (value: string) => void;
  error?: string; type?: string; required?: boolean; readOnly?: boolean;
}) {
  return <div>
    <label htmlFor={name} className="block text-sm font-medium text-black">{label}{isRequired ? " *" : ""}</label>
    <input id={name} name={name} type={type} value={value} readOnly={readOnly}
      onChange={(event) => onChange?.(event.target.value)}
      aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined}
      className="mt-2 w-full border border-black/30 bg-white/50 px-4 py-3 outline-none focus:border-black read-only:bg-black/5" />
    {error && <p id={`${name}-error`} role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </div>;
}

function SelectField({ label, name, value, options, onChange, error }: {
  label: string; name: string; value: string; options: readonly (readonly [string, string])[];
  onChange: (value: string) => void; error?: string;
}) {
  return <div><label htmlFor={name} className="block text-sm font-medium">{label} *</label>
    <select id={name} value={value} onChange={(event) => onChange(event.target.value)}
      className="mt-2 w-full border border-black/30 bg-white/50 px-4 py-3">
      <option value="">Select</option>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}
    </select>{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}</div>;
}

export default function ParticipantProfileClient({ participant, initialProfile }: Props) {
  const [durableProfile, setDurableProfile] = useState(initialProfile);
  const [form, setForm] = useState(() => draftOf(initialProfile));
  const [fieldErrors, setFieldErrors] = useState<ParticipantProfileFieldErrors>({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    submissionLock.current = true; setIsSubmitting(true); setMessage("");
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
    finally { submissionLock.current = false; setIsSubmitting(false); }
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

  return <main className="min-h-screen bg-[#f4f2ed] text-black">
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:py-16">
      <header className="border-b border-black pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-black/55">Wealth Path AI Global · Participant Portal</p>
        <h1 className="mt-5 font-serif text-5xl tracking-[-0.04em]">Participant profile</h1>
        <p className="mt-5 max-w-3xl leading-7 text-black/65">Save progress at any time. Completing the profile confirms the required information is present; it does not complete enrollment.</p>
      </header>

      <section className="my-8 grid gap-4 border border-black bg-black p-6 text-white sm:grid-cols-3">
        <div><p className="text-xs uppercase tracking-widest text-white/55">Status</p><p className="mt-2 text-lg">{durableProfile.profileCompleted ? "Profile complete" : message.startsWith("Draft saved") ? "Draft saved" : "Profile incomplete"}</p>{completedAt && <p className="mt-1 text-sm text-white/65">Completed {completedAt}</p>}</div>
        <div><p className="text-xs uppercase tracking-widest text-white/55">Required fields</p><p className="mt-2 text-lg">{completedCount} of {required.length}</p></div>
        <div><p className="text-xs uppercase tracking-widest text-white/55">Last updated</p><p className="mt-2 text-lg">{updated}</p></div>
      </section>

      <form onSubmit={(event) => { event.preventDefault(); void submit("save"); }} className="space-y-10" noValidate>
        <section><h2 className="font-serif text-3xl">Identity and personal details</h2><div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Field label="First name" name="firstName" value={form.firstName} onChange={input("firstName")} error={fieldErrors.firstName} required />
          <Field label="Middle name" name="middleName" value={form.middleName} onChange={input("middleName")} />
          <Field label="Last name" name="lastName" value={form.lastName} onChange={input("lastName")} error={fieldErrors.lastName} required />
          <Field label="Preferred name" name="preferredName" value={form.preferredName} onChange={input("preferredName")} />
          <Field label="Date of birth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={input("dateOfBirth")} error={fieldErrors.dateOfBirth} required />
          <SelectField label="Gender" name="gender" value={form.gender} options={genderOptions} onChange={input("gender")} error={fieldErrors.gender} />
          <SelectField label="Marital status" name="maritalStatus" value={form.maritalStatus} options={maritalOptions} onChange={input("maritalStatus")} error={fieldErrors.maritalStatus} />
          <Field label="Email (managed through your account)" name="email" type="email" value={durableProfile.email ?? ""} readOnly />
        </div></section>

        <section><h2 className="font-serif text-3xl">Contact and address</h2><div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Field label="Phone country code" name="phoneCountryCode" value={form.phoneCountryCode} onChange={input("phoneCountryCode")} error={fieldErrors.phoneCountryCode} required />
          <Field label="Phone number" name="phoneNumber" type="tel" value={form.phoneNumber} onChange={input("phoneNumber")} error={fieldErrors.phoneNumber} required />
          <Field label="Country code" name="countryCode" value={form.countryCode} onChange={input("countryCode")} error={fieldErrors.countryCode} required />
          <Field label="State or province" name="state" value={form.state} onChange={input("state")} error={fieldErrors.state} required />
          <Field label="District" name="district" value={form.district} onChange={input("district")} />
          <Field label="City" name="city" value={form.city} onChange={input("city")} error={fieldErrors.city} required />
          <Field label="Postal code" name="postalCode" value={form.postalCode} onChange={input("postalCode")} error={fieldErrors.postalCode} required />
        </div></section>

        <section><h2 className="font-serif text-3xl">Education, employment, and household</h2><div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Field label="Education level" name="educationLevel" value={form.educationLevel} onChange={input("educationLevel")} />
          <Field label="Occupation" name="occupation" value={form.occupation} onChange={input("occupation")} />
          <SelectField label="Employment status" name="employmentStatus" value={form.employmentStatus} options={employmentOptions} onChange={input("employmentStatus")} error={fieldErrors.employmentStatus} />
          <Field label="Household members" name="householdSize" type="number" value={form.householdSize ?? ""} onChange={input("householdSize")} error={fieldErrors.householdSize} required />
          <Field label="Financial dependants" name="dependents" type="number" value={form.dependents ?? ""} onChange={input("dependents")} error={fieldErrors.dependents} required />
        </div></section>

        <section><h2 className="font-serif text-3xl">Emergency contact</h2><div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Field label="Contact name" name="emergencyContactName" value={form.emergencyContactName} onChange={input("emergencyContactName")} error={fieldErrors.emergencyContactName} required />
          <Field label="Relationship" name="emergencyContactRelationship" value={form.emergencyContactRelationship} onChange={input("emergencyContactRelationship")} error={fieldErrors.emergencyContactRelationship} required />
          <Field label="Phone in international format" name="emergencyContactPhone" type="tel" value={form.emergencyContactPhone} onChange={input("emergencyContactPhone")} error={fieldErrors.emergencyContactPhone} required />
        </div></section>

        {message && <p role="status" className="border border-black p-4">{message}</p>}
        {Object.keys(fieldErrors).length > 0 && <p className="text-sm text-red-700">Review the highlighted fields before continuing.</p>}
        <div className="flex flex-wrap gap-4 border-t border-black pt-8">
          <button type="submit" disabled={isSubmitting} className="border border-black px-6 py-3 disabled:opacity-50">{isSubmitting ? "Saving…" : "Save Progress"}</button>
          <button type="button" disabled={isSubmitting} onClick={() => void submit("complete")} className="bg-black px-6 py-3 text-white disabled:opacity-50">Complete Profile</button>
        </div>
        <p className="text-sm text-black/55">Participant {participant.participant_code} · {participant.lifecycle_status.replaceAll("_", " ")}</p>
      </form>
    </div>
  </main>;
}
