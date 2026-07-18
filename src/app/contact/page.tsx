import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/layout/container";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Wealth Path AI Global regarding research, collaboration, institutional partnerships, and publications.",
};
export default function ContactPage() {
  return (
    <>
      <SiteHeader />

      <main className="bg-black text-white">
        <section className="border-b border-white/10">
          <Container className="py-40">
            <p className="mb-8 text-sm uppercase tracking-[0.35em] text-white/40">
              Contact
            </p>

            <h1 className="max-w-5xl text-6xl font-bold leading-tight md:text-7xl">
              Connect with Wealth Path AI Global.
            </h1>

            <p className="mt-12 max-w-4xl text-2xl leading-relaxed text-white/60">
              WPAG welcomes thoughtful enquiries related to research,
              collaboration, institutional development, publications, and the
              ongoing evolution of the Human Financial Operating System.
            </p>
          </Container>
        </section>
        <section className="border-b border-white/10">
  <Container className="py-40">
    <p className="text-sm uppercase tracking-[0.35em] text-white/40">
      Research Enquiries
    </p>

    <div className="mt-16 grid gap-px bg-white/10 md:grid-cols-2">
      {[
        {
          title: "Research Collaboration",
          description:
            "Enquiries related to structured financial research, case documentation, framework testing, and evidence development.",
        },
        {
          title: "Institutional Partnerships",
          description:
            "Conversations with organizations interested in research support, knowledge development, or long-term institutional collaboration.",
        },
        {
          title: "Academic Discussion",
          description:
            "Engagement with researchers, educators, and professionals examining financial stability, diagnosis, measurement, and continuity.",
        },
        {
          title: "Media and Publications",
          description:
            "Requests concerning interviews, research commentary, publications, and the public communication of WPAG and HFOS.",
        },
      ].map((item) => (
        <article key={item.title} className="bg-black p-10 md:p-12">
          <h2 className="text-2xl font-semibold">
            {item.title}
          </h2>

          <p className="mt-6 text-lg leading-8 text-white/50">
            {item.description}
          </p>
        </article>
      ))}
    </div>
  </Container>
</section>
<section className="border-b border-white/10">
  <Container className="py-40">
    <div className="grid gap-20 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-white/40">
          Contact Guidelines
        </p>

        <h2 className="mt-10 max-w-xl text-4xl font-bold leading-tight md:text-5xl">
          Clear context supports meaningful communication.
        </h2>
      </div>

      <div className="space-y-8 text-xl leading-relaxed text-white/60">
        <p>
          WPAG welcomes enquiries that contribute to research, institutional
          dialogue, evidence development, and long-term knowledge building.
        </p>

        <div className="space-y-5 border-t border-white/10 pt-8">
          {[
            "Research-related enquiries are prioritised.",
            "Collaboration requests should include sufficient context, purpose, and expected contribution.",
            "Media and publication requests should clearly identify the intended format and audience.",
            "Commercial solicitations or unrelated promotional requests may not receive a response.",
          ].map((item) => (
            <div
              key={item}
              className="flex gap-5 border-b border-white/10 pb-5"
            >
              <span className="mt-1 text-sm text-white/30">—</span>

              <p>{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </Container>
</section>
<section className="border-b border-white/10">
  <Container className="py-40">
    <div className="grid gap-20 lg:grid-cols-[1fr_1fr]">
      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-white/40">
          Response Policy
        </p>

        <h2 className="mt-10 text-4xl font-bold leading-tight md:text-5xl">
          Every enquiry is reviewed with care.
        </h2>
      </div>

      <div className="space-y-8 text-xl leading-relaxed text-white/60">
        <p>
          WPAG reviews each enquiry individually. Responses are prioritised
          according to research relevance, institutional value, and alignment
          with the organisation's long-term objectives.
        </p>

        <p>
          Response times may vary depending on the nature of the enquiry.
          Submission of an enquiry does not guarantee collaboration,
          publication, or partnership.
        </p>

        <p>
          The objective of every interaction is to preserve clarity,
          professionalism, and the integrity of ongoing research.
        </p>
      </div>
    </div>
  </Container>
</section>
      </main>

      <SiteFooter />
    </>
  );
}