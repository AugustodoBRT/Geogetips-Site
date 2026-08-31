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
          cor: "#1A1715",
        },
        {
          rotulo: "TAXA DE ACERTO",
          valor: `${stats.taxaAcerto.toFixed(1).replace(".", ",")}%`,
          cor: "#1A1715",
        },
        {
          rotulo: "RESULTADO",
          valor: `${stats.totalUnidades >= 0 ? "+" : ""}${stats.totalUnidades
            .toFixed(2)
            .replace(".", ",")}u`,
          cor: stats.totalUnidades >= 0 ? "#2D8659" : "#C23B22",
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
          background: "#F7F5F0",
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
              background: "#1A1715",
              color: "#F7F5F0",
              fontSize: 30,
              fontWeight: 700,
              borderRadius: 14,
            }}
          >
            G
          </div>
          <div style={{ fontSize: 34, color: "#1A1715", letterSpacing: -0.5 }}>
            GeogeTips
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 74,
              lineHeight: 1.05,
              color: "#1A1715",
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
              color: "#C7522A",
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
                    color: "#9E9689",
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
          <div style={{ fontSize: 26, color: "#6B645A" }}>
            Registro, análise e controle de banca — em dados, não achismo.
          </div>
        )}
      </div>
    ),
    size
  );
}
