import { metadadosDaPagina } from "@/lib/metadados";
import { textoDasRotas } from "@/texto/rotas";

export const metadata = metadadosDaPagina({
  ...textoDasRotas().apostas,
  caminho: "/apostas",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
