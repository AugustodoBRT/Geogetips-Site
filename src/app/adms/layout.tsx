import { metadadosDaPagina } from "@/lib/metadados";

export const metadata = metadadosDaPagina({
  titulo: "Performance dos Adms",
  descricao:
    "Taxa de acerto, volume, ROI e lucro em unidades de cada adm do GeogeTips.",
  caminho: "/adms",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
