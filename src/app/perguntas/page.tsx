import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { LinkPlanilha } from "@/components/LinkPlanilha";
import { SecaoTelegram } from "@/components/Telegram";
import { metadadosDaPagina } from "@/lib/metadados";
import {
  type Acao,
  dadosEstruturados,
  jsonParaScript,
  METODO,
  PERGUNTAS,
} from "@/lib/perguntas";

export const metadata = metadadosDaPagina({
  titulo: "Perguntas frequentes",
  descricao:
    "Como o lucro, o ROI, a taxa de acerto e a maior queda do GeogeTips são calculados, e o que perguntam antes de entrar no grupo.",
  caminho: "/perguntas",
});

/** Link de uma resposta: para fora do site abre em outra aba, dentro dele navega. */
function LinkDaResposta({ acao }: { acao: Acao }) {
  const classe =
    "inline-flex items-center gap-1 py-[5px] -my-[5px] text-xs font-bold text-[var(--accent)] hover:underline focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded";
  if (acao.href.startsWith("/")) {
    return (
      <Link href={acao.href} className={classe}>
        {acao.rotulo}
        <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
      </Link>
    );
  }
  return (
    <a href={acao.href} target="_blank" rel="noopener noreferrer" className={classe}>
      {acao.rotulo}
      <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
    </a>
  );
}

/**
 * Perguntas frequentes e o método dos números (#66).
 *
 * Página do servidor, sem nenhum JavaScript próprio: é texto para ler, e tem
 * de aparecer inteiro para quem chega pela busca e para o robô que indexa.
 *
 * O método vem aberto, em cartões, porque é para onde as outras telas apontam
 * (`/perguntas#roi`): quem clica em "como é calculado" tem de cair na resposta,
 * e não numa pergunta fechada. As perguntas gerais vêm em `<details>`, que abre
 * e fecha sem script, e a busca do navegador abre sozinha quando acha o termo
 * dentro de uma resposta fechada.
 */
export default function PerguntasPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 animate-entrada">
      <header>
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--text)] tracking-tight">
          Perguntas frequentes
        </h1>
        <p className="text-sm text-[var(--text-2)] mt-2 leading-relaxed max-w-2xl">
          Como cada número do site é calculado, e o que costumam perguntar antes de entrar
          no grupo. Tudo sai da planilha pública, que continua aberta para conferência.
        </p>
        <LinkPlanilha className="mt-3" />
      </header>

      <section aria-labelledby="titulo-metodo" className="space-y-4">
        <div>
          <h2
            id="titulo-metodo"
            className="font-serif text-2xl text-[var(--text)] tracking-tight"
          >
            Como os números são calculados
          </h2>
          <p className="text-xs text-[var(--text-3)] mt-1">
            As mesmas contas que a planilha faz, para os números baterem linha a linha.
          </p>
        </div>

        <dl className="grid sm:grid-cols-2 gap-3">
          {METODO.map((t) => (
            // scroll-mt: a barra do topo é fixa e cobriria o título do cartão
            // de quem chega pela âncora.
            <div
              key={t.id}
              id={t.id}
              className="scroll-mt-24 bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-5 shadow-sm target:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] target:ring-2 target:ring-[var(--accent-soft)]"
            >
              <dt className="text-sm font-bold text-[var(--text)] tracking-tight">
                {t.termo}
              </dt>
              <dd className="mt-2 space-y-2 text-[13px] leading-relaxed text-[var(--text-2)]">
                {t.resposta.map((paragrafo) => (
                  <p key={paragrafo}>{paragrafo}</p>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="titulo-grupo" className="space-y-4">
        <h2
          id="titulo-grupo"
          className="font-serif text-2xl text-[var(--text)] tracking-tight"
        >
          Sobre o grupo
        </h2>

        <div className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl shadow-sm divide-y divide-tinta/[0.06]">
          {PERGUNTAS.map((p) => (
            <details key={p.id} id={p.id} className="group scroll-mt-24">
              <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-sm font-bold text-[var(--text)] hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)] rounded-2xl transition-colors">
                {p.pergunta}
                <Plus
                  className="w-4 h-4 shrink-0 text-[var(--text-3)] transition-transform duration-200 group-open:rotate-45"
                  aria-hidden="true"
                />
              </summary>
              <div className="px-5 pb-5 -mt-1 space-y-2 text-[13px] leading-relaxed text-[var(--text-2)]">
                {p.resposta.map((paragrafo) => (
                  <p key={paragrafo}>{paragrafo}</p>
                ))}
                {p.acao && (
                  <p className="pt-1">
                    <LinkDaResposta acao={p.acao} />
                  </p>
                )}
              </div>
            </details>
          ))}
        </div>
      </section>

      <SecaoTelegram />

      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: é o jeito de pôr JSON-LD na página; o texto é fixo, sai de lib/perguntas.ts, e jsonParaScript escapa o "<".
        dangerouslySetInnerHTML={{ __html: jsonParaScript(dadosEstruturados()) }}
      />
    </div>
  );
}
