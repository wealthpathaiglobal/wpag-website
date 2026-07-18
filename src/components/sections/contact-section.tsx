import { Container } from "@/components/layout/container";
import { typography } from "@/styles/typography";

export function ContactSection() {
  return (
    <section
      id="contact"
      className="border-t border-zinc-900 bg-black py-32 text-white"
    >
      <Container>
        <p className={`mb-6 ${typography.caption}`}>CONTACT</p>

        <h2 className={`max-w-5xl ${typography.display}`}>
          Connect with Wealth Path AI Global.
        </h2>

       <p className={`mt-10 max-w-3xl ${typography.bodyLarge}`}>
  For research discussions, professional collaboration, institutional
  partnerships, or general enquiries, please get in touch.
</p>
        <a
          href="mailto:srinivasthallapalli98@gmail.com"
          className="mt-10 inline-flex border border-white/20 px-6 py-3 text-sm font-medium text-white transition hover:border-white/50"
        >
          Send an Email
        </a>
      </Container>
    </section>
  );
}