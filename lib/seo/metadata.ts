import type { Metadata } from "next";
import { getSiteUrl, SITE } from "./site";

const TITLE_SUFFIX = "| Capstone Scheduler";

interface BuildPageMetadataParams {
  title: string;
  description?: string;
  path: string;
  noindex?: boolean;
}

export function buildPageMetadata({
  title,
  description,
  path,
  noindex,
}: BuildPageMetadataParams): Metadata {
  const siteUrl = getSiteUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const canonicalUrl = `${siteUrl}${normalizedPath}`;
  const desc = description || SITE.defaultDescription;
  const socialTitle = title.includes(TITLE_SUFFIX) ? title : `${title} ${TITLE_SUFFIX}`;

  return {
    title,
    description: desc,
    alternates: { canonical: canonicalUrl },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: SITE.locale,
      url: canonicalUrl,
      title: socialTitle,
      description: desc,
      siteName: SITE.name,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: desc,
    },
  };
}
