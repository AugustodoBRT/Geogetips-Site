import { metadadosDaPagina } from "@/lib/metadados";

export const metadata = metadadosDaPagina({
  titulo: "Feed de Apostas",
  descricao:
    "Todas as apostas do GeogeTips em ordem cronológica, com odd, casa, valor e resultado. Filtre por data, esporte, casa e faixa de odd.",
  caminho: "/apostas",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
