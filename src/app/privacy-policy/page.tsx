import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Wealth Path AI Global.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-8 text-4xl font-bold">Privacy Policy</h1>

      <p className="mb-6">
        This Privacy Policy explains how Wealth Path AI Global collects,
        uses, and protects information when you use our website.
      </p>

      <p className="mb-6">
        A complete Privacy Policy will be published as the website continues
        to evolve.
      </p>

      <p>
        Last Updated: July 2026
      </p>
    </main>
  );
}