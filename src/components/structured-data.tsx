import { getTranslations } from "next-intl/server";

interface StructuredDataProps {
  locale: string;
  webUrl: string;
}

export async function StructuredData({ locale, webUrl }: StructuredDataProps) {
  const t = await getTranslations();

  const title = t("metadata.title") || "Timero - Free Online Timer, Stopwatch, Alarm & World Clock";
  const description = t("metadata.description") || "Free online timer and clock tool with countdown timer, stopwatch, alarm clock, and world clock features.";

  // WebApplication structured data
  const webApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Timero",
    "alternateName": title,
    "description": description,
    "url": webUrl,
    "applicationCategory": "UtilityApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1000"
    },
    "featureList": [
      "Countdown Timer (10 seconds to 16 hours)",
      "Precise Stopwatch with Lap Timer",
      "Multi-Alarm System",
      "World Clock with Multiple Timezones",
      "Customizable Themes and Sounds",
      "No Registration Required",
      "Free to Use"
    ],
    "screenshot": `${webUrl}/imgs/features/1.png`,
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "softwareVersion": "1.0.0",
    "releaseNotes": "Free online time management tool combining countdown timer, stopwatch, alarm clock, and world clock.",
    "inLanguage": locale === "zh" ? "zh-CN" : "en-US",
    "isAccessibleForFree": true,
    "license": `${webUrl}/terms-of-service`
  };

  // SoftwareApplication structured data
  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Timero",
    "applicationCategory": "UtilityApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": description,
    "url": webUrl,
    "screenshot": `${webUrl}/imgs/features/1.png`,
    "featureList": [
      "Timer",
      "Stopwatch",
      "Alarm",
      "World Clock"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1000"
    }
  };

  // Organization structured data
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Timero Team",
    "url": webUrl,
    "logo": `${webUrl}/logo.svg`,
    "sameAs": [],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "email": "support@timero.app"
    }
  };

  // Website structured data
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Timero",
    "url": webUrl,
    "description": description,
    "inLanguage": locale === "zh" ? "zh-CN" : "en-US",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${webUrl}/?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webApplicationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplicationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
    </>
  );
}

