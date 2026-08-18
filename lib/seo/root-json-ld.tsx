import { getSiteUrlFromRequest } from "./request-site-url";
import { SITE } from "./site";

export async function RootJsonLd() {
  const siteUrl = await getSiteUrlFromRequest();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Khoa Kỹ thuật Phần mềm, Đại học FPT",
        url: siteUrl,
      },
      {
        "@type": "WebSite",
        name: SITE.name,
        url: siteUrl,
        inLanguage: "vi-VN",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
