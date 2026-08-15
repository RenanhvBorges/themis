import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Themis — Sistema de Apuração de Transgressões Disciplinares",
  description: "BINFAE-RJ — Processo Administrativo de Transgressão Disciplinar (PATD)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
