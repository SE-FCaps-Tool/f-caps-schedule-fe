import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { Toaster } from "@/components/ui/sonner";
import { getSiteUrl, SITE } from "@/lib/seo/site";
import { RootJsonLd } from "@/lib/seo/root-json-ld";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE.name,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.defaultDescription,
  keywords: [
    "capstone",
    "đồ án tốt nghiệp",
    "xếp lịch bảo vệ",
    "FPT University",
    "Khoa Kỹ thuật Phần mềm",
  ],
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: getSiteUrl(),
    title: SITE.name,
    description: SITE.defaultDescription,
    siteName: SITE.name,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </Providers>
        <RootJsonLd />
      </body>
    </html>
  );
}
