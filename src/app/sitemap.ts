import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

const PAGINAS: { caminho: string; frequencia: "hourly" | "daily"; prioridade: number }[] = [
  { caminho: "/", frequencia: "daily", prioridade: 1 },
  { caminho: "/painel", frequencia: "hourly", prioridade: 0.9 },
  { caminho: "/apostas", frequencia: "hourly", prioridade: 0.9 },
  { caminho: "/historico", frequencia: "daily", prioridade: 0.7 },
  { caminho: "/adms", frequencia: "daily", prioridade: 0.7 },
  { caminho: "/estatisticas", frequencia: "daily", prioridade: 0.7 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const agora = new Date();
  return PAGINAS.map((p) => ({
    url: `${SITE_URL}${p.caminho === "/" ? "" : p.caminho}`,
    lastModified: agora,
    changeFrequency: p.frequencia,
    priority: p.prioridade,
  }));
}
