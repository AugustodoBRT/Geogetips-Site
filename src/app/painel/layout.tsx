import { metadadosDaPagina } from "@/lib/metadados";
import { textoDasRotas } from "@/texto/rotas";

export const metadata = metadadosDaPagina({
  ...textoDasRotas().painel,
  caminho: "/painel",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
