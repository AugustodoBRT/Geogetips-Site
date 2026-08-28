import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

export const metadata: Metadata = {
  title: "GeoGeTips — Matemática para ganhar",
  description:
    "Análise, dados, palpites e resultados de apostas esportivas com inteligência e controle de banca.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen flex flex-col bg-[#F7F5F0] text-[#1A1715]">
        <Navigation />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
