import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const interface_ = Inter({
  subsets: ["latin"],
  variable: "--fonte-interface",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Themis — Apuração de Transgressão Disciplinar",
  description:
    "Sistema de condução e gestão do Processo de Apuração de Transgressão Disciplinar (PATD), conforme a ICA 111-6/2021.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={interface_.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
