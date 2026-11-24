import { metadadosDaPagina } from "@/lib/metadados";
import { textoDasRotas } from "@/texto/rotas";

export const metadata = metadadosDaPagina({
  ...textoDasRotas().estatisticas,
  caminho: "/estatisticas",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
