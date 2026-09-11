import { metadadosDaPagina } from "@/lib/metadados";

export const metadata = metadadosDaPagina({
  titulo: "Painel de Performance",
  descricao:
    "Lucro, ROI, taxa de acerto e evolução da banca do GeogeTips, calculados a partir da planilha pública de apostas.",
  caminho: "/painel",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
