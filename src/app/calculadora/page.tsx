import type { Metadata } from "next";
import { CalculadoraEV } from "@/components/CalculadoraEV";

/**
 * A calculadora de valor esperado (#71).
 *
 * Ainda não está decidido se ela vai ser aberta a todos ou exclusiva do canal
 * pago. Até lá, a página existe só para quem tem o endereço: fica fora do menu,
 * fora do sitemap e pede para não ser indexada. Divulgar é tirar o `robots`
 * daqui, pôr a rota no `sitemap.ts` e um link no menu ou no rodapé.
 */
export const metadata: Metadata = {
  title: "Calculadora de valor esperado",
  description:
    "Odd justa, hold, surebet e múltiplas: descubra se uma odd paga mais do que a probabilidade real justifica.",
  alternates: { canonical: "/calculadora" },
  robots: { index: false, follow: false },
};

export default function CalculadoraPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 animate-entrada">
      <header>
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--text)] tracking-tight">
          Calculadora de valor esperado
        </h1>
        <p className="text-sm text-[var(--text-2)] mt-2 leading-relaxed max-w-2xl">
          Descubra se uma odd paga mais do que a probabilidade real justifica. A margem da
          casa sai da conta, e o que sobra é a odd justa.
        </p>
      </header>

      <CalculadoraEV />

      <p className="text-[11.5px] text-[var(--text-3)] leading-relaxed max-w-3xl">
        A calculadora faz conta, não previsão. Valor esperado positivo quer dizer que a
        odd paga mais do que a probabilidade estimada pela casa de referência, não que a
        aposta vai dar green. Aposte apenas o que você pode perder.
      </p>
    </div>
  );
}
