import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Wealth Path AI Global.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-24">
      <h1 className="mb-10 text-5xl font-bold tracking-tight">
        Privacy Policy
      </h1>

      <div className="space-y-8 text-lg leading-8 text-neutral-700">
        <p>
          Wealth Path AI Global is committed to protecting the privacy of
          visitors to this website.
        </p>

        <p>
          This Privacy Policy explains how information may be collected, used,
          and protected when you visit or interact with our website.
        </p>

        <section>
          <h2 className="mb-3 text-2xl font-semibold text-black">
            Information We Collect
          </h2>

          <p>
            We may collect limited technical information such as:
          </p>

          <ul className="list-disc space-y-2 pl-6">
            <li>Browser type</li>
            <li>Device information</li>
            <li>Pages visited</li>
            <li>Visit duration</li>
            <li>General website analytics</li>
          </ul>

          <p className="mt-4">
            This information helps us understand website usage and improve the
            visitor experience.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold text-black">
            Google Analytics
          </h2>

          <p>
            This website uses Google Analytics to understand website traffic,
            visitor behavior, and overall website performance. Google Analytics
            may use cookies and similar technologies to collect anonymous usage
            information.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold text-black">
            Information You Provide
          </h2>

          <p>
            If you choose to contact Wealth Path AI Global, we may receive the
            information you voluntarily provide, such as your name, email
            address, and message.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold text-black">
            Data Protection
          </h2>

          <p>
            We take reasonable measures to protect information collected through
            this website. However, no method of electronic transmission or
            electronic storage can be guaranteed to be completely secure.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold text-black">
            Third-Party Services
          </h2>

          <p>
            This website may contain links to third-party websites or services.
            Wealth Path AI Global is not responsible for the privacy practices
            or content of external websites.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold text-black">
            Policy Updates
          </h2>

          <p>
            This Privacy Policy may be updated from time to time to reflect
            changes to our website, services, technologies, or legal
            requirements. Any updates will be published on this page.
          </p>
        </section>

        <hr className="my-10 border-neutral-300" />

        <p className="font-medium text-black">
          Last Updated: July 2026
        </p>
      </div>
    </main>
  );
}