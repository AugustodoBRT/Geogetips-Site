export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-gradient-to-r from-[var(--bg-tinted)] via-[var(--bg-shimmer)] to-[var(--bg-tinted)] bg-[length:200%_100%] animate-shimmer rounded-lg ${className}`}
    />
  );
}

export function SkeletonKpis({ quantidade = 4 }: { quantidade?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: quantidade }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-black/[0.07] rounded-2xl p-5 shadow-sm space-y-3"
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
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
