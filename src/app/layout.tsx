import type { Metadata } from "next";

import { AppProviders } from "@/components/providers/app-providers";
import { env } from "@/lib/env";
import "./globals.css";

const appTitle = "MARGEM APP - Calculadora de precificacao";
const appDescription =
  "MARGEM APP centraliza ingredientes, receitas e calculos para definir precos com seguranca e clareza.";

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: appTitle,
  description: appDescription,
  applicationName: "MARGEM APP",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/margem-app-mark.svg",
    shortcut: "/margem-app-mark.svg",
    apple: "/margem-app-mark.svg",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "MARGEM APP",
    title: appTitle,
    description: appDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MARGEM APP - Calculadora de precificacao",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: appTitle,
    description: appDescription,
    images: ["/twitter-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
