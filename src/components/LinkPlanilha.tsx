import { ArrowUpRight, Table2 } from "lucide-react";
import { PLANILHA_URL } from "@/lib/constants";

/**
 * Prova de transparência ao lado dos números. Um painel pode ser maquiado;
 * a planilha compartilhada, não.
 */
export function LinkPlanilha({ className = "" }: { className?: string }) {
  return (
    <a
      href={PLANILHA_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B645A] hover:text-[#C7522A] focus-visible:ring-2 focus-visible:ring-[#C7522A] rounded transition-colors ${className}`}
    >
      <Table2 className="w-3.5 h-3.5" aria-hidden="true" />
      <span>Conferir linha a linha na planilha</span>
      <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
    </a>
  );
}
