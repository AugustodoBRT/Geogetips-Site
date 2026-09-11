import { metadadosDaPagina } from "@/lib/metadados";

export const metadata = metadadosDaPagina({
  titulo: "Estatísticas & Padrões",
  descricao:
    "Distribuição de resultados, médias de odd e lucro por esporte e por casa de apostas no GeogeTips.",
  caminho: "/estatisticas",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
