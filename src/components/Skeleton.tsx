/**
 * Esqueletos de carregamento.
 *
 * A regra desta pasta: **o esqueleto tem de ter a forma da tela que vai
 * chegar**. Barra genérica no lugar de um gráfico não prepara ninguém para
 * nada — e, pior, quando o conteúdo real entra com outra altura, a página
 * salta. A grade de KPIs do painel é `xl:grid-cols-5`; um esqueleto em
 * `lg:grid-cols-4` reposiciona cinco cartões no instante em que os dados
 * chegam.
 *
 * Estes blocos aparecem **só** pelo estado `loading` de dentro da página.
 *
 * Não há `loading.tsx` de rota, e a falta não custa nada: as cinco telas de
 * dados são pré-renderizadas com `loading` valendo true, então o HTML que o
 * servidor entrega **já contém o esqueleto**. Ele está na tela no primeiro
 * quadro, antes de qualquer JavaScript rodar.
 *
 * A tentativa de somar um `loading.tsx` a isso foi desfeita: com ele, o Next
 * 15.5 marcava a fronteira de Suspense como adiada (`<!--$~-->`) e o conteúdo
 * real nunca substituía o esqueleto — em desenvolvimento e no build de
 * produção, nas cinco rotas.
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-gradient-to-r from-[var(--bg-tinted)] via-[var(--bg-shimmer)] to-[var(--bg-tinted)] bg-[length:200%_100%] animate-shimmer rounded-lg ${className}`}
    />
  );
}

/** Cartão branco, com a mesma moldura dos cartões de verdade. */
function Cartao({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-black/[0.07] rounded-2xl shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Grade de KPIs. As duas grades que existem no site estão escritas por extenso
 * aqui dentro porque o Tailwind lê classe escrita, não classe montada em tempo
 * de execução.
 */
export function SkeletonKpis({
  quantidade = 4,
  grade = "quatro",
}: {
  quantidade?: number;
  /** `cinco` é a grade do painel; `quatro`, a do histórico. */
  grade?: "quatro" | "cinco";
}) {
  const classes =
    grade === "cinco"
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4";

  return (
    <div className={classes}>
      {Array.from({ length: quantidade }).map((_, i) => (
        <Cartao key={i} className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </Cartao>
      ))}
    </div>
  );
}

export function SkeletonLinhas({
  quantidade = 5,
  altura = "h-16",
}: {
  quantidade?: number;
  altura?: string;
}) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: quantidade }).map((_, i) => (
        <Skeleton key={i} className={`w-full ${altura}`} />
      ))}
    </div>
  );
}

/** Lista de ranking: rótulo à esquerda, barra e número à direita. */
export function SkeletonRanking({
  linhas = 4,
  titulo = true,
  className = "",
}: {
  linhas?: number;
  titulo?: boolean;
  className?: string;
}) {
  return (
    <Cartao className={`p-6 space-y-4 ${className}`}>
      {titulo && (
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-56" />
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: linhas }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded-lg shrink-0" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-12 shrink-0" />
          </div>
        ))}
      </div>
    </Cartao>
  );
}

/* -------------------------------------------------------------------------
   Corpos de tela — o que cada página mostra enquanto a planilha responde.
   ------------------------------------------------------------------------- */

/**
 * Só o corpo: o cabeçalho de cada tela é o de verdade e continua clicável
 * enquanto a planilha responde, então dá para trocar de aba no meio da espera
 * em vez de assistir a ela.
 */
export function SkeletonCorpoHistorico() {
  return (
    <>
      <SkeletonKpis quantidade={4} />
      <Cartao className="p-6 space-y-4">
        <Skeleton className="h-5 w-56" />
        <SkeletonLinhas quantidade={4} altura="h-14" />
      </Cartao>
    </>
  );
}

export function SkeletonCorpoAdms() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Cartao key={i} className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-14 rounded-xl" />
            ))}
          </div>
        </Cartao>
      ))}
    </div>
  );
}

export function SkeletonCorpoEstatisticas() {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <SkeletonRanking linhas={4} className="lg:col-span-7" />
        <SkeletonRanking linhas={5} className="lg:col-span-5" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonRanking linhas={5} />
        <SkeletonRanking linhas={5} />
      </div>
    </>
  );
}

