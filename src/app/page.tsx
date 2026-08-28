"use client";

import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Target,
  Landmark,
  BarChart3,
  Bot,
  Zap,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 md:px-12 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#C7522A]/[0.08] border border-[#C7522A]/[0.12] rounded-full text-xs font-semibold text-[#C7522A] mb-7">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Análise · Dados · Palpites · Resultados</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.1] tracking-[-1.5px] text-[#1A1715] mb-5">
          Seus palpites merecem <br />
          <em className="italic text-[#C7522A] font-serif">matemática de verdade.</em>
        </h1>

        <p className="text-base sm:text-lg text-[#6B645A] leading-relaxed max-w-xl mx-auto mb-9 font-sans">
          O GeoGeTips transforma dados brutos em decisões inteligentes. Registre,
          acompanhe e analise cada aposta com a clareza de quem usa números — não achismo.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/painel"
            className="px-7 py-3 bg-[#1A1715] text-[#F7F5F0] text-sm font-semibold rounded-full hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2 shadow-xs"
          >
            <span>Acessar Painel</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/apostas"
            className="px-7 py-3 bg-transparent text-[#1A1715] text-sm font-semibold border border-black/15 rounded-full hover:bg-[#EFECE6] active:scale-[0.98] transition-all"
          >
            Ver Apostas
          </Link>
        </div>
      </section>

      {/* Trust Strip */}
      <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 px-6 pb-16 text-xs text-[#9E9689] font-medium">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-[#6B645A] text-sm">342</span> apostas registradas
        </div>
        <div className="w-1 h-1 rounded-full bg-black/15 hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-[#6B645A] text-sm">63,4%</span> taxa de acerto
        </div>
        <div className="w-1 h-1 rounded-full bg-black/15 hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-[#6B645A] text-sm">30+</span> casas suportadas
        </div>
        <div className="w-1 h-1 rounded-full bg-black/15 hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-[#6B645A] text-sm">24/7</span> bot automático
        </div>
      </div>

      {/* Product Mockup Preview */}
      <div className="max-w-5xl mx-auto px-6 mb-20">
        <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden shadow-subtle">
          <div className="h-10 bg-[#F0EDE5] border-b border-black/[0.07] flex items-center px-4 gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-black/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-black/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-black/20" />
            <div className="ml-4 px-3 py-1 bg-white/70 rounded-md text-[11px] font-mono text-[#6B645A] border border-black/[0.04]">
              geogetips.app/painel
            </div>
          </div>
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#FAF8F5]">
            <div className="p-5 bg-white rounded-xl border border-black/[0.06] shadow-xs">
              <div className="text-[11px] font-semibold text-[#9E9689] uppercase tracking-wider mb-2">
                Lucro Total
              </div>
              <div className="font-serif text-3xl text-[#2D8659] tracking-tight">
                +R$ 847,20
              </div>
              <div className="text-xs font-medium text-[#2D8659] mt-1.5 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>↑ 12,3% este mês</span>
              </div>
            </div>

            <div className="p-5 bg-white rounded-xl border border-black/[0.06] shadow-xs">
              <div className="text-[11px] font-semibold text-[#9E9689] uppercase tracking-wider mb-2">
                Taxa de Acerto
              </div>
              <div className="font-serif text-3xl text-[#1A1715] tracking-tight">
                63,4%
              </div>
              <div className="text-xs font-medium text-[#2D8659] mt-1.5">
                ↑ 2,1pp vs mês anterior
              </div>
            </div>

            <div className="p-5 bg-white rounded-xl border border-black/[0.06] shadow-xs">
              <div className="text-[11px] font-semibold text-[#9E9689] uppercase tracking-wider mb-2">
                Apostas Pendentes
              </div>
              <div className="font-serif text-3xl text-[#B8860B] tracking-tight">
                7
              </div>
              <div className="text-xs font-medium text-[#B8860B] mt-1.5">
                Aguardando finalização
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Section */}
      <section className="max-w-5xl mx-auto px-6 mb-24">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#9E9689] mb-3">
          Funcionalidades
        </div>
        <h2 className="font-serif text-3xl md:text-4xl text-[#1A1715] tracking-tight mb-10 leading-tight">
          Tudo que você precisa, <br />
          nada que não precisa.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Bento Item 1 (Wide) */}
          <div className="md:col-span-4 bg-white border border-black/[0.07] rounded-2xl p-7 relative overflow-hidden flex flex-col justify-between hover:border-black/20 hover:-translate-y-0.5 transition-all shadow-xs group">
            <div className="w-10 h-10 rounded-xl bg-[#C7522A]/10 text-[#C7522A] flex items-center justify-center mb-6">
              <Bot className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1715] mb-1.5 tracking-tight">
                Registro Automático via Telegram
              </h3>
              <p className="text-[13.5px] text-[#6B645A] leading-relaxed">
                Envie prints de qualquer casa no Telegram. A IA (Groq LLaMA) com OCR extrai
                partida, mercado, odd e valor de forma determinística. Sem digitação manual.
              </p>
            </div>
          </div>

          {/* Bento Item 2 */}
          <div className="md:col-span-2 bg-white border border-black/[0.07] rounded-2xl p-7 relative overflow-hidden flex flex-col justify-between hover:border-black/20 hover:-translate-y-0.5 transition-all shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#2D8659]/10 text-[#2D8659] flex items-center justify-center mb-6">
              <FileSpreadsheet className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1715] mb-1.5 tracking-tight">
                Planilha Sincronizada
              </h3>
              <p className="text-[13.5px] text-[#6B645A] leading-relaxed">
                Sua planilha no Google Sheets continua viva e atualizada em tempo real.
              </p>
            </div>
          </div>

          {/* Bento Item 3 */}
          <div className="md:col-span-2 bg-white border border-black/[0.07] rounded-2xl p-7 relative overflow-hidden flex flex-col justify-between hover:border-black/20 hover:-translate-y-0.5 transition-all shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#B8860B]/10 text-[#B8860B] flex items-center justify-center mb-6">
              <Target className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1715] mb-1.5 tracking-tight">
                Análise por Tipster
              </h3>
              <p className="text-[13.5px] text-[#6B645A] leading-relaxed">
                Descubra quem realmente coloca dinheiro no seu bolso e quem dá prejuízo.
              </p>
            </div>
          </div>

          {/* Bento Item 4 */}
          <div className="md:col-span-2 bg-white border border-black/[0.07] rounded-2xl p-7 relative overflow-hidden flex flex-col justify-between hover:border-black/20 hover:-translate-y-0.5 transition-all shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#C7522A]/10 text-[#C7522A] flex items-center justify-center mb-6">
              <Landmark className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1715] mb-1.5 tracking-tight">
                Gestão de Banca
              </h3>
              <p className="text-[13.5px] text-[#6B645A] leading-relaxed">
                Controle de unidades (1u = 1%), travas de segurança e limites máximos.
              </p>
            </div>
          </div>

          {/* Bento Item 5 */}
          <div className="md:col-span-2 bg-white border border-black/[0.07] rounded-2xl p-7 relative overflow-hidden flex flex-col justify-between hover:border-black/20 hover:-translate-y-0.5 transition-all shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#2D8659]/10 text-[#2D8659] flex items-center justify-center mb-6">
              <BarChart3 className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1715] mb-1.5 tracking-tight">
                Estatísticas Completas
              </h3>
              <p className="text-[13.5px] text-[#6B645A] leading-relaxed">
                Lucro por esporte, casa, odds médias e métricas reais de assertividade.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-white border-y border-black/[0.07] py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#9E9689] mb-3">
            Como Funciona
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-[#1A1715] tracking-tight mb-12">
            Três passos. Sem complicação.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <div className="font-serif text-5xl text-[#EFECE6] leading-none mb-4 tracking-tighter">
                01
              </div>
              <h3 className="text-base font-bold text-[#1A1715] mb-2 tracking-tight">
                Receba o palpite
              </h3>
              <p className="text-[13.5px] text-[#6B645A] leading-relaxed">
                O tipster envia o print no Telegram. Pode ser qualquer formato de aposta ou casa.
              </p>
            </div>

            <div>
              <div className="font-serif text-5xl text-[#EFECE6] leading-none mb-4 tracking-tighter">
                02
              </div>
              <h3 className="text-base font-bold text-[#1A1715] mb-2 tracking-tight">
                O bot faz o resto
              </h3>
              <p className="text-[13.5px] text-[#6B645A] leading-relaxed">
                OCR + Groq LLaMA processam o texto e salvam na planilha BETS automaticamente.
              </p>
            </div>

            <div>
              <div className="font-serif text-5xl text-[#EFECE6] leading-none mb-4 tracking-tighter">
                03
              </div>
              <h3 className="text-base font-bold text-[#1A1715] mb-2 tracking-tight">
                Acompanhe e lucre
              </h3>
              <p className="text-[13.5px] text-[#6B645A] leading-relaxed">
                Acesse este painel para ver sua evolução, filtrar apostas e entender seus números.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 text-center text-xs text-[#9E9689]">
        <p>geogetips — matemática para ganhar. feito com dados, não achismo.</p>
      </footer>
    </div>
  );
}
