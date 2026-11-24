import { metadadosDaPagina } from "@/lib/metadados";
import { textoDasRotas } from "@/texto/rotas";

export const metadata = metadadosDaPagina({
  ...textoDasRotas().adms,
  caminho: "/adms",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
