import type { Metadata } from "next";

import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "MARGEM APP - Calculadora de precificação",
  description:
    "MARGEM APP centraliza ingredientes, receitas e cálculos para definir preços com segurança e clareza.",
  applicationName: "MARGEM APP",
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
