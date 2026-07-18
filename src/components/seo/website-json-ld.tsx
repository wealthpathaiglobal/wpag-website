export function WebsiteJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://wealthpathaiglobal.com/#website",

    url: "https://wealthpathaiglobal.com",

    name: "Wealth Path AI Global",
    alternateName: "WPAG",

    description:
      "Wealth Path AI Global is an independent research organization developing structured financial systems and the Human Financial Operating System (HFOS).",

    inLanguage: "en",

    publisher: {
      "@id": "https://wealthpathaiglobal.com/#organization",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd),
      }}
    />
  );
}