import { metadadosDaPagina } from "@/lib/metadados";

export const metadata = metadadosDaPagina({
  titulo: "Histórico Mês a Mês",
  descricao:
    "Resultado, ROI e taxa de acerto de cada mês do GeogeTips lado a lado, incluindo os meses negativos.",
  caminho: "/historico",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
