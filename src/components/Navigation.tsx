"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Layers } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { label: "Início", href: "/" },
    { label: "Painel", href: "/painel" },
    { label: "Apostas", href: "/apostas" },
    { label: "Tipsters", href: "/tipsters" },
    { label: "Estatísticas", href: "/estatisticas" },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between bg-[#F7F5F0]/90 backdrop-blur-md border-b border-black/[0.07]">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-[32px] h-[32px] bg-[#1A1715] rounded-xl flex items-center justify-center text-[#F7F5F0] font-bold text-sm tracking-tight transition-transform group-hover:scale-95 shadow-xs">
              G
            </div>
            <span className="font-serif text-xl tracking-tight text-[#1A1715]">
              geogetips
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1.5 bg-[#FAF8F5] p-1 rounded-full border border-black/[0.05]">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-150 ${
                    isActive
                      ? "bg-white text-[#1A1715] shadow-xs"
                      : "text-[#6B645A] hover:text-[#1A1715] hover:bg-white/50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/apostas"
              className="px-4 py-2 bg-[#1A1715] text-[#F7F5F0] text-xs font-bold rounded-full hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ver Apostas</span>
            </Link>
          </div>
        </div>
      </nav>
      <div className="h-16" />
    </>
  );
}
export { Navigation };
