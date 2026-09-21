import { CORES } from "@/lib/cores";
import { ImageResponse } from "next/og";
import { MarcaG } from "@/components/MarcaG";
import { getBetsFromTab, USANDO_MOCK } from "@/lib/sheets";
import { computeStatsFromBets } from "@/lib/stats";
import { MOCK_BETS } from "@/lib/data";
import { ABA_TODOS } from "@/lib/constants";
import { formatarInteiro, formatarUnidades } from "@/lib/format";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "GeogeTips — análise e resultados de apostas esportivas";

// Regenera junto com a home, para o preview do link não ficar preso em números velhos.
export const revalidate = 300;

const TITULO_1 = "Suas apostas merecem";
const TITULO_2 = "matemática de verdade.";
const RODAPE = "Registro, análise e controle de banca — em dados, não achismo.";

/**
 * Busca uma fonte do Google Fonts como arquivo, só com os caracteres usados.
 *
 * A imagem de compartilhamento saía na fonte genérica do sistema, e não na DM
 * Serif e na Inter do site: é a primeira coisa que alguém vê de um link
 * mandado no grupo, e parecia de outro lugar. O gerador de imagem não lê
 * woff2, então a folha de estilo é pedida sem navegador moderno no cabeçalho —
 * assim o Google responde com TrueType. `text=` recorta a fonte ao que a
 * imagem escreve: alguns KB em vez da família inteira.
 *
 * Se a busca falhar, a imagem sai assim mesmo, na fonte genérica: preview de
 * link sem fonte bonita é melhor que preview nenhum.
 */
async function carregarFonte(
  familia: string,
  texto: string
): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${familia}&text=${encodeURIComponent(texto)}`,
      { signal: AbortSignal.timeout(5000) }
    ).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const resposta = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return resposta.ok ? await resposta.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function OpenGraphImage() {
  let stats: ReturnType<typeof computeStatsFromBets> | null = null;
  try {
    stats = computeStatsFromBets(
      USANDO_MOCK ? MOCK_BETS : await getBetsFromTab(ABA_TODOS)
    );
  } catch {
    stats = null;
  }

  const temNumeros = Boolean(stats && stats.totalBets > 0);

  const metricas =
    temNumeros && stats
      ? [
          {
            rotulo: "APOSTAS",
            valor: formatarInteiro(stats.totalBets),
            cor: CORES.text,
          },
          {
            rotulo: "TAXA DE ACERTO",
            valor: `${stats.taxaAcerto.toFixed(1).replace(".", ",")}%`,
            cor: CORES.text,
          },
          {
            rotulo: "RESULTADO",
            valor: formatarUnidades(stats.totalUnidades),
            cor: stats.totalUnidades >= 0 ? CORES.green : CORES.red,
          },
        ]
      : [];

  // Tudo que a Inter escreve na imagem, para o recorte da fonte levar só isso.
  const textoInter = [...metricas.flatMap((m) => [m.rotulo, m.valor]), RODAPE].join("");

  const [serif, serifItalico, interNegrito, interMedio] = await Promise.all([
    carregarFonte("DM+Serif+Display", `GeogeTips${TITULO_1}`),
    carregarFonte("DM+Serif+Display:ital@1", TITULO_2),
    carregarFonte("Inter:wght@700", textoInter),
    carregarFonte("Inter:wght@600", textoInter),
  ]);

  const fontes = [
    serif && {
      name: "DM Serif Display",
      data: serif,
      weight: 400 as const,
      style: "normal" as const,
    },
    serifItalico && {
      name: "DM Serif Display",
      data: serifItalico,
      weight: 400 as const,
      style: "italic" as const,
    },
    interNegrito && {
      name: "Inter",
      data: interNegrito,
      weight: 700 as const,
      style: "normal" as const,
    },
    interMedio && {
      name: "Inter",
      data: interMedio,
      weight: 600 as const,
      style: "normal" as const,
    },
  ].filter((f) => f !== null);

  const SERIF = serif ? "DM Serif Display" : "serif";
  const SANS = interNegrito ? "Inter" : "sans-serif";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: CORES.bg,
        padding: 72,
        fontFamily: SANS,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <MarcaG tamanho={52} tinta={CORES.text} no={CORES.accent} fundo={CORES.bg} />
        <div
          style={{
            display: "flex",
            fontSize: 36,
            fontFamily: SERIF,
            letterSpacing: -0.5,
          }}
        >
          <span style={{ color: CORES.text }}>Geoge</span>
          <span style={{ color: CORES.accent }}>Tips</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          style={{
            fontSize: 74,
            lineHeight: 1.05,
            color: CORES.text,
            letterSpacing: -2.5,
            maxWidth: 900,
            fontFamily: SERIF,
          }}
        >
          {TITULO_1}
        </div>
        <div
          style={{
            fontSize: 74,
            lineHeight: 1.05,
            color: CORES.accent,
            letterSpacing: -2.5,
            fontStyle: "italic",
            fontFamily: SERIF,
          }}
        >
          {TITULO_2}
        </div>
      </div>

      {metricas.length > 0 ? (
        <div style={{ display: "flex", gap: 56 }}>
          {metricas.map((m) => (
            <div
              key={m.rotulo}
              style={{ display: "flex", flexDirection: "column", gap: 6 }}
            >
              <div
                style={{
                  fontSize: 17,
                  color: CORES.text3,
                  letterSpacing: 2,
                  fontWeight: 600,
                }}
              >
                {m.rotulo}
              </div>
              <div style={{ fontSize: 46, color: m.cor, fontWeight: 700 }}>{m.valor}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 26, color: CORES.text2 }}>{RODAPE}</div>
      )}
    </div>,
    { ...size, fonts: fontes }
  );
}
