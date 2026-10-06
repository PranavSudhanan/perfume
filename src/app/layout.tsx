import type { Metadata } from "next";
import { getSettings } from "@/lib/data";
import { siteUrl } from "@/lib/site";
import { fontsHref, themeCss } from "@/lib/theme";
import "./globals.css";

// Every page reads admin-editable settings, so nothing is prerendered at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { store } = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: store.seoTitle || store.name, template: `%s · ${store.name}` },
    description: store.seoDescription,
    openGraph: {
      siteName: store.name,
      type: "website",
      images: store.socialImage ? [store.socialImage] : undefined,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { theme } = await getSettings();
  return (
    <html lang="en" data-btn={theme.buttonStyle} data-card={theme.cardStyle}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={fontsHref(theme)} />
        {/* themeCss only emits allow-listed values (see lib/theme.ts). */}
        <style dangerouslySetInnerHTML={{ __html: themeCss(theme) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
