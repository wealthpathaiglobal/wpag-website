export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://wealthpathaiglobal.com/#organization",

    name: "Wealth Path AI Global",
    alternateName: "WPAG",

    url: "https://wealthpathaiglobal.com",
    logo: "https://wealthpathaiglobal.com/icon.png",

    email: "contact@wealthpathaiglobal.com",

    description:
      "Wealth Path AI Global is an independent research organization developing the Human Financial Operating System (HFOS), a structured framework for financial stability, diagnosis, and long-term continuity.",

    founder: {
      "@type": "Person",
      name: "Srinivas Goud",
    },

    sameAs: [
      "https://www.linkedin.com/company/wealth-path-ai-global/",
      "https://github.com/wealthpathaiglobal",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}