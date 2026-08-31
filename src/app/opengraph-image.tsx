import { CORES } from "@/lib/cores";
import { ImageResponse } from "next/og";
import { getBetsFromTab, USANDO_MOCK } from "@/lib/sheets";
import { computeStatsFromBets } from "@/lib/stats";
import { MOCK_BETS } from "@/lib/data";
import { ABA_TODOS } from "@/lib/constants";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "GeogeTips — análise e resultados de apostas esportivas";

// Regenera junto com a home, para o preview do link não ficar preso em números velhos.
export const revalidate = 300;

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

  const metricas = temNumeros && stats
    ? [
        {
          rotulo: "APOSTAS",
          valor: String(stats.totalBets),
          cor: CORES.text,
        },
        {
          rotulo: "TAXA DE ACERTO",
          valor: `${stats.taxaAcerto.toFixed(1).replace(".", ",")}%`,
          cor: CORES.text,
        },
        {
          rotulo: "RESULTADO",
          valor: `${stats.totalUnidades >= 0 ? "+" : ""}${stats.totalUnidades
            .toFixed(2)
            .replace(".", ",")}u`,
          cor: stats.totalUnidades >= 0 ? CORES.green : CORES.red,
        },
      ]
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: CORES.bg,
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: CORES.text,
              color: CORES.bg,
              fontSize: 30,
              fontWeight: 700,
              borderRadius: 14,
            }}
          >
            G
          </div>
          <div style={{ fontSize: 34, color: CORES.text, letterSpacing: -0.5 }}>
            GeogeTips
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
            }}
          >
            Seus palpites merecem
          </div>
          <div
            style={{
              fontSize: 74,
              lineHeight: 1.05,
              color: CORES.accent,
              letterSpacing: -2.5,
              fontStyle: "italic",
            }}
          >
            matemática de verdade.
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
                <div style={{ fontSize: 46, color: m.cor, fontWeight: 700 }}>
                  {m.valor}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 26, color: CORES.text2 }}>
            Registro, análise e controle de banca — em dados, não achismo.
          </div>
        )}
      </div>
    ),
    size
  );
}
