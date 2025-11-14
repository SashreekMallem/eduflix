import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react"
import Head from 'next/head';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://www.eduflixai.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "EduFlix AI - Educational Platform by Sashreek Mallem",
    template: "%s | EduFlix AI"
  },
  description: "EduFlix AI is an innovative educational platform created by Sashreek Mallem (Sashreek Reddy Mallem). Discover personalized learning experiences and AI-powered education.",
  keywords: ["Sashreek Mallem", "Sashreek Reddy Mallem", "EduFlix", "EduFlix AI", "education", "learning platform", "AI education"],
  authors: [{ name: "Sashreek Mallem", url: SITE_URL }],
  creator: "Sashreek Mallem",
  publisher: "Sashreek Mallem",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "EduFlix AI",
    title: "EduFlix AI - Educational Platform by Sashreek Mallem",
    description: "EduFlix AI is an innovative educational platform created by Sashreek Mallem (Sashreek Reddy Mallem). Discover personalized learning experiences and AI-powered education.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "EduFlix AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EduFlix AI - Educational Platform by Sashreek Mallem",
    description: "EduFlix AI is an innovative educational platform created by Sashreek Mallem (Sashreek Reddy Mallem). Discover personalized learning experiences and AI-powered education.",
    creator: "@SashreekMallem",
    images: [`${SITE_URL}/og-image.png`],
  },
  verification: {
    google: "google-site-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Sashreek Mallem",
    "alternateName": "Sashreek Reddy Mallem",
    "url": SITE_URL,
    "sameAs": [
      "https://github.com/SashreekMallem"
    ],
    "jobTitle": "Developer",
    "description": "Creator of EduFlix AI, an innovative educational platform",
    "knowsAbout": ["Education Technology", "AI", "Software Development"]
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "EduFlix AI",
    "alternateName": "EduFlix",
    "url": SITE_URL,
    "description": "Educational platform created by Sashreek Mallem",
    "creator": {
      "@type": "Person",
      "name": "Sashreek Mallem",
      "alternateName": "Sashreek Reddy Mallem"
    }
  };

  return (
    <html lang="en">
      <Head>
        {/* LinkedIn Insight Tag */}
        <script type="text/javascript">
          {`
            _linkedin_partner_id = "7011572";
            window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
            window._linkedin_data_partner_ids.push(_linkedin_partner_id);
            (function(l) {
              if (!l) {
                window.lintrk = function(a, b) {
                  window.lintrk.q.push([a, b]);
                };
                window.lintrk.q = [];
              }
              var s = document.getElementsByTagName("script")[0];
              var b = document.createElement("script");
              b.type = "text/javascript";
              b.async = true;
              b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
              s.parentNode.insertBefore(b, s);
            })(window.lintrk);
          `}
        </script>
        <noscript>
          <img height="1" width="1" style={{ display: 'none' }} alt="" src="https://px.ads.linkedin.com/collect/?pid=YOUR_PARTNER_ID&fmt=gif" />
        </noscript>
      </Head>
      <head>
        {/* JSON-LD Structured Data for Person */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        {/* JSON-LD Structured Data for Website */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
