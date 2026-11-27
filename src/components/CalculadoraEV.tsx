"use client";

import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ArrowDown, Plus, Trash2 } from "lucide-react";
import { useEstadoNaUrl } from "@/hooks/useEstadoNaUrl";
import { useUnidade } from "@/hooks/useUnidade";
import { escolher } from "@/lib/endereco";
import {
  formatarOddExata,
  formatarOddJusta,
  formatarPorcentagem,
  formatarReais,
  formatarUnidadesSemSinal,
  lerNumeroBR,
  formatarDecimal,
} from "@/lib/format";
import {
  BANCA_PADRAO_EM_UNIDADES,
  calcularMultipla,
  calcularOddJusta,
  calcularPorHold,
  calcularSurebet,
  FRACAO_DE_KELLY_PADRAO,
  FRACOES_DE_KELLY,
  lerOdd,
  lerPorcentagem,
  margem,
  PASSOS_DA_SUREBET,
  probabilidadesJustas,
  STAKE_ALTA,
  stakeDeKelly,
} from "@/lib/calculadora";
import { DIGITACAO, type TipoDeCampo } from "@/lib/digitacao";
import { textoDaCalculadora } from "@/texto/calculadora";
import type { Trecho } from "@/texto/forma";

const T = textoDaCalculadora();

/**
 * Os quatro modos, só os valores.
 *
 * O `id` vai ao endereço (`?modo=hold`) e volta dele; o rótulo mora no
 * dicionário, em `modos`, num mapa indexado por este tipo — modo sem rótulo
 * não compila.
 */
const MODOS = ["justa", "hold", "surebet", "multipla"] as const;

type Modo = (typeof MODOS)[number];

/**
 * Quantos resultados um mercado pode ter em cada modo (#82). Odd justa e cada
 * seleção da múltipla vão até 8 (um "placar exato" resumido, um campeão de
 * grupo); surebet até 4, porque cada resultado pede uma casa diferente e acima
 * disso quase nunca fecha.
 */
const MAXIMO_DE_RESULTADOS = 8;
const MAXIMO_DE_RESULTADOS_NA_SUREBET = 4;

/** Seleção como está digitada: texto cru, lido só na hora da conta. */
interface SelecaoDigitada {
  resultados: number;
  analisada: string;
  /** Sempre com espaço para o maior mercado; a tela usa as `resultados - 1` primeiras. */
  contrarias: string[];
}

const SELECAO_VAZIA: SelecaoDigitada = {
  resultados: 2,
  analisada: "",
  contrarias: Array(MAXIMO_DE_RESULTADOS - 1).fill(""),
};

/** Um exemplo com as contrárias preenchidas até o fim, com espaço para o resto. */
function exemploDeSelecao(
  resultados: number,
  analisada: string,
  contrarias: string[]
): SelecaoDigitada {
  return {
    resultados,
    analisada,
    contrarias: [...contrarias, ...SELECAO_VAZIA.contrarias].slice(
      0,
      MAXIMO_DE_RESULTADOS - 1
    ),
  };
}

const JUSTA_VAZIA = { ...SELECAO_VAZIA, encontrada: "" };
const HOLD_VAZIO = { base: "", margem: "", encontrada: "" };
const SUREBET_VAZIA = {
  investimento: "100,00",
  passo: 0.01 as number,
  resultados: 2,
  odds: Array(MAXIMO_DE_RESULTADOS_NA_SUREBET).fill("") as string[],
};

const MAXIMO_DE_SELECOES = 10;

/**
 * 0,0526 → "5,26%". Sem sinal: para isso existe `formatarPorcentagem`.
 *
 * O sinal daqui saía de `fracao > 0`, decidido antes do `toFixed` logo abaixo —
 * então um valor mínimo arredondava para 0,00 e ficava "+0,00%". O `Intl` de
 * `formatarPorcentagem` arredonda primeiro e só então decide, e por isso é ele
 * quem escreve os valores com sinal nesta tela.
 */
function porcento(fracao: number, casas = 2): string {
  return `${formatarDecimal(fracao * 100, casas)}%`;
}

/** Odd lida de um campo, e se o campo mostra erro: só quando há texto e ele não é odd. */
function lerCampoDeOdd(texto: string): { valor: number | null; erro: boolean } {
  const valor = lerOdd(texto);
  return { valor, erro: texto.trim() !== "" && valor === null };
}

/** As odds de uma seleção, lidas, e a odd justa do resultado analisado quando todas valem. */
function lerSelecao(s: SelecaoDigitada) {
  const analisada = lerCampoDeOdd(s.analisada);
  const contrarias = s.contrarias.slice(0, s.resultados - 1).map(lerCampoDeOdd);
  const pronta = analisada.valor !== null && contrarias.every((c) => c.valor !== null);
  const oddJusta = pronta
    ? 1 /
      probabilidadesJustas([
        analisada.valor as number,
        ...contrarias.map((c) => c.valor as number),
      ])[0]
    : null;
  return { analisada, contrarias, oddJusta };
}

const CLASSE_CAMPO =
  "w-full bg-[var(--bg)] border rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-[var(--text)] placeholder:font-normal placeholder:text-[var(--text-3)] outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors";

/**
 * Liga um campo de texto ao formato do tipo dele (lib/digitacao.ts): limpa a
 * cada tecla, formata ao sair, e Enter passa para o próximo campo do bloco.
 *
 * Limpar o texto a cada tecla faz o React reescrever o valor, e o cursor iria
 * para o fim; por isso ele é devolvido ao lugar certo depois de cada troca,
 * contando só o que sobrou antes dele.
 */
function useDigitacao(
  tipo: TipoDeCampo,
  valor: string,
  onChange: (valor: string) => void
) {
  const ref = useRef<HTMLInputElement>(null);
  const cursor = useRef<number | null>(null);
  const { digitando, aoSair } = DIGITACAO[tipo];

  useLayoutEffect(() => {
    const el = ref.current;
    if (cursor.current !== null && el && document.activeElement === el) {
      el.setSelectionRange(cursor.current, cursor.current);
    }
    cursor.current = null;
  });

  return {
    ref,
    value: valor,
    type: "text",
    // type="text" com teclado decimal: o type="number" joga fora o valor que
    // chega com vírgula em parte dos navegadores.
    inputMode: "decimal" as const,
    enterKeyHint: "next" as const,
    autoComplete: "off",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const bruto = e.target.value;
      const limpo = digitando(bruto);
      const antes = digitando(bruto.slice(0, e.target.selectionStart ?? bruto.length));
      cursor.current = Math.min(antes.length, limpo.length);
      onChange(limpo);
    },
    onBlur: () => {
      const final = aoSair(valor);
      if (final !== valor) onChange(final);
    },
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const campos = Array.from(
        e.currentTarget.closest("section")?.querySelectorAll("input") ?? []
      );
      const proximo = campos[campos.indexOf(e.currentTarget) + 1];
      if (proximo) proximo.focus();
      else e.currentTarget.blur();
    },
  };
}

/**
 * Uma frase do dicionário, com os trechos destacados dentro de `<strong>`.
 *
 * `forte` é a classe do destaque comum desta frase; o papel `perda` ganha
 * vermelho, porque é o único caso em que a mesma frase tem dois destaques
 * desenhados diferente. Ver `Trecho`, em texto/forma.ts.
 */
function Frase({
  partes,
  forte = "text-[var(--text)]",
}: {
  partes: readonly Trecho[];
  forte?: string;
}) {
  return (
    <>
      {partes.map((parte, i) => {
        if (typeof parte === "string") return parte;
        const classe = parte.papel === "perda" ? "text-[var(--red)]" : forte;
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: a frase é fixa
          <strong key={i} className={classe || undefined}>
            {parte.forte}
          </strong>
        );
      })}
    </>
  );
}

function Campo({
  id,
  rotulo,
  valor,
  onChange,
  exemplo,
  tipo = "odd",
  erro,
  sufixo,
  destaque,
}: {
  id: string;
  rotulo: string;
  valor: string;
  onChange: (valor: string) => void;
  exemplo: string;
  tipo?: TipoDeCampo;
  erro?: boolean;
  sufixo?: string;
  /** O campo principal do bloco: a odd do resultado em que se vai apostar. */
  destaque?: boolean;
}) {
  const idErro = `${id}-erro`;
  const campo = useDigitacao(tipo, valor, onChange);
  return (
    <div className="space-y-1.5 min-w-0">
      <label
        htmlFor={id}
        className={`block text-xs font-bold truncate ${
          destaque ? "text-[var(--accent)]" : "text-[var(--text)]"
        }`}
      >
        {rotulo}
      </label>
      <div className="relative">
        <input
          id={id}
          {...campo}
          placeholder={T.campo.exemplo(exemplo)}
          aria-invalid={erro || undefined}
          aria-describedby={erro ? idErro : undefined}
          className={`${CLASSE_CAMPO} ${sufixo ? "pr-8" : ""} ${
            erro
              ? "border-[var(--red)]"
              : destaque
                ? "border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)]"
                : "border-tinta/[0.1]"
          }`}
        />
        {sufixo && (
          <span
            aria-hidden="true"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-3)] pointer-events-none"
          >
            {sufixo}
          </span>
        )}
      </div>
      {erro && (
        <p
          id={idErro}
          className="text-[11.5px] leading-snug text-[var(--red)] font-semibold"
        >
          {T.campo.erro[tipo]}
        </p>
      )}
    </div>
  );
}

/** Quantos resultados tem o mercado: lista, e não botões, porque vai até 8. */
function SeletorDeResultados({
  id,
  rotulo,
  valor,
  maximo,
  onChange,
}: {
  id: string;
  rotulo: string;
  valor: number;
  maximo: number;
  onChange: (valor: number) => void;
}) {
  return (
    <select
      id={id}
      aria-label={rotulo}
      value={valor}
      onChange={(e) => onChange(Number(e.target.value))}
      className="bg-[var(--bg)] border border-tinta/[0.12] rounded-full pl-3.5 pr-2 py-1.5 text-xs font-bold text-[var(--text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] cursor-pointer hover:border-[color:color-mix(in_srgb,var(--accent)_60%,transparent)] transition-colors"
    >
      {Array.from({ length: maximo - 1 }, (_, i) => i + 2).map((n) => (
        <option key={n} value={n}>
          {T.mercado.quantos(n)}
        </option>
      ))}
    </select>
  );
}

/**
 * Um bloco de campos com título e a explicação dele.
 *
 * A explicação fica aqui, uma vez, e não embaixo de cada campo: as dicas de
 * tamanhos diferentes desalinhavam a grade, e com oito resultados virariam
 * oito repetições da mesma frase.
 */
function Bloco({
  titulo,
  descricao,
  acao,
  children,
}: {
  titulo: string;
  descricao: ReactNode;
  acao?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1 basis-56">
          <h3 className="text-sm font-bold text-[var(--text)]">{titulo}</h3>
          <p className="text-[12px] leading-snug text-[var(--text-3)] mt-0.5">
            {descricao}
          </p>
        </div>
        {acao}
      </div>
      {children}
    </div>
  );
}

/** As odds de todos os resultados de um mercado, numa grade só. */
function OddsDoMercado({
  prefixo,
  selecao,
  lida,
  onChange,
}: {
  prefixo: string;
  selecao: SelecaoDigitada;
  lida: ReturnType<typeof lerSelecao>;
  onChange: (selecao: SelecaoDigitada) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-start">
      <Campo
        id={`${prefixo}-analisada`}
        rotulo={T.mercado.analisada}
        exemplo="1,90"
        destaque
        valor={selecao.analisada}
        erro={lida.analisada.erro}
        onChange={(v) => onChange({ ...selecao, analisada: v })}
      />
      {lida.contrarias.map((c, i) => (
        <Campo
          // biome-ignore lint/suspicious/noArrayIndexKey: a posição é a identidade do campo, e a lista só cresce e encolhe pelo fim.
          key={i}
          id={`${prefixo}-contraria-${i + 1}`}
          rotulo={
            selecao.resultados === 2
              ? T.mercado.contraria
              : T.mercado.contrariaNumerada(i + 1)
          }
          exemplo={selecao.resultados === 2 ? "1,90" : "3,60"}
          valor={selecao.contrarias[i]}
          erro={c.erro}
          onChange={(v) => {
            const novas = [...selecao.contrarias];
            novas[i] = v;
            onChange({ ...selecao, contrarias: novas });
          }}
        />
      ))}
    </div>
  );
}

/**
 * A odd justa ao lado do campo da odd encontrada, para comparar de olho.
 *
 * Não é região viva: o resultado já é, e as duas juntas faziam o leitor de
 * tela anunciar a mesma odd duas vezes a cada tecla.
 */
function OddDeComparacao({ rotulo, odd }: { rotulo: string; odd: number | null }) {
  return (
    <div className="space-y-1.5 min-w-0">
      <span className="block text-xs font-bold text-[var(--text-2)] truncate">
        {rotulo}
      </span>
      <div className="px-3.5 py-2.5 rounded-xl border border-dashed border-tinta/[0.14] text-sm font-mono font-bold text-[var(--text)]">
        {odd !== null ? (
          formatarOddJusta(odd)
        ) : (
          <span className="text-[var(--text-3)]">{T.campo.semOdd}</span>
        )}
      </div>
    </div>
  );
}

/** "Como usar" de cada modo, com o botão que preenche o exemplo. */
function ComoUsar({
  children,
  onExemplo,
}: {
  children: ReactNode;
  onExemplo: () => void;
}) {
  return (
    <details className="group rounded-xl border border-tinta/[0.07] bg-[var(--bg-soft)]">
      <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-xs font-bold text-[var(--text)] hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)] rounded-xl transition-colors">
        {T.ajuda.titulo}
        <Plus
          className="w-3.5 h-3.5 text-[var(--text-3)] transition-transform duration-200 group-open:rotate-45"
          aria-hidden="true"
        />
      </summary>
      <div className="px-4 pb-4 space-y-2 text-[12.5px] leading-relaxed text-[var(--text-2)]">
        {children}
        <button
          type="button"
          onClick={onExemplo}
          className="mt-1 inline-flex items-center px-3 py-1.5 rounded-full border border-tinta/[0.1] bg-[var(--bg-card)] text-xs font-bold text-[var(--accent)] hover:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors"
        >
          {T.ajuda.exemplo}
        </button>
      </div>
    </details>
  );
}

function Detalhe({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="bg-[var(--bg-soft)] rounded-xl px-3.5 py-3 min-w-0">
      <dt className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--text-3)]">
        {rotulo}
      </dt>
      <dd className="font-mono text-base font-bold text-[var(--text)] mt-0.5">{valor}</dd>
    </div>
  );
}

/** Veredito de valor esperado: a pílula, o número grande e a frase em reais. */
function Veredito({
  valorEsperado,
  oddJusta,
}: {
  valorEsperado: number;
  oddJusta: number;
}) {
  const temValor = valorEsperado > 0;
  return (
    <div className="space-y-2">
      <span
        className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
          temValor
            ? "bg-[var(--green-soft)] text-[var(--green)]"
            : "bg-[var(--red-soft)] text-[var(--red)]"
        }`}
      >
        {temValor ? T.veredito.comValor : T.veredito.semValor}
      </span>
      <div
        className={`font-serif text-5xl tracking-tight leading-none ${
          temValor ? "text-[var(--green)]" : "text-[var(--red)]"
        }`}
      >
        {formatarPorcentagem(valorEsperado * 100)}
      </div>
      <p className="text-xs text-[var(--text-2)] leading-relaxed">
        <Frase
          partes={T.veredito.frase({
            aposta: formatarReais(100),
            retorno: formatarReais(100 * (1 + valorEsperado)),
            oddJusta: formatarOddJusta(oddJusta),
          })}
        />
      </p>
    </div>
  );
}

/** Como o visitante quer dimensionar a stake: a fração do Kelly e a banca em unidades. */
interface Gestao {
  fracao: number;
  /** Banca em unidades, como está digitada. */
  banca: string;
}

const GESTAO_PADRAO: Gestao = {
  fracao: FRACAO_DE_KELLY_PADRAO,
  banca: String(BANCA_PADRAO_EM_UNIDADES),
};

/** Onde a fração e a banca ficam guardadas: é preferência de quem visita, como a unidade. */
const CHAVE_GESTAO = "geogetips:kelly";

/**
 * A stake recomendada pelo critério de Kelly, em unidades.
 *
 * Unidade, e não porcentagem, porque é assim que o grupo manda as entradas.
 * Com a banca padrão de 100u, a stake em unidades é a porcentagem da banca; a
 * banca muda a conta para quem trabalha com outra proporção. O valor em reais
 * usa a unidade escolhida no Painel, a mesma do resto do site.
 */
function StakeRecomendada({
  odd,
  probabilidade,
  gestao,
  onGestao,
}: {
  odd: number;
  probabilidade: number;
  gestao: Gestao;
  onGestao: (gestao: Gestao) => void;
}) {
  const { unidade } = useUnidade();
  const bancaLida = lerNumeroBR(gestao.banca);
  const bancaValida = bancaLida !== null && bancaLida > 0;
  const stake = stakeDeKelly(
    odd,
    probabilidade,
    gestao.fracao,
    bancaValida ? bancaLida : 0
  );
  const banca = useDigitacao("unidades", gestao.banca, (v) =>
    onGestao({ ...gestao, banca: v })
  );
  const fracao = FRACOES_DE_KELLY.find((f) => f.valor === gestao.fracao);

  return (
    <div className="rounded-xl border border-tinta/[0.07] bg-[var(--bg-soft)] p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--text-3)]">
          {T.stake.titulo}
        </h3>
        <span className="text-[10.5px] font-bold text-[var(--text-3)]">
          {T.stake.kelly(fracao?.rotulo.toLowerCase() ?? "")}
        </span>
      </div>

      {!bancaValida ? (
        <p className="text-xs text-[var(--text-2)]">{T.stake.semBanca}</p>
      ) : stake.unidades > 0 ? (
        <div className="space-y-1.5">
          <p className="font-mono text-3xl font-bold leading-none text-[var(--text)]">
            {formatarUnidadesSemSinal(stake.unidades)}
          </p>
          <p className="text-xs text-[var(--text-2)] leading-relaxed">
            <Frase
              partes={T.stake.linha({
                daBanca: porcento(stake.fracaoDaBanca),
                emReais: formatarReais(stake.unidades * unidade),
                unidade: formatarReais(unidade),
              })}
            />
          </p>
          {stake.fracaoDaBanca > STAKE_ALTA && (
            <p className="text-[11.5px] leading-snug font-semibold text-[var(--red)]">
              {T.stake.alta(porcento(STAKE_ALTA, 0))}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <p className="font-mono text-3xl font-bold leading-none text-[var(--text)]">
            0u
          </p>
          <p className="text-xs text-[var(--text-2)] leading-relaxed">{T.stake.zero}</p>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3 pt-3 border-t border-tinta/[0.06]">
        <div className="space-y-1.5">
          <span
            id="rotulo-fracao-kelly"
            className="block text-[11px] font-bold text-[var(--text-2)]"
          >
            {T.stake.fracao}
          </span>
          {/* biome-ignore lint/a11y/useSemanticElements: o que a regra pede no lugar é <fieldset>, que chega com borda, margem e padding do navegador; aqui é uma barra de botões, como as outras do site. */}
          <div
            role="group"
            aria-labelledby="rotulo-fracao-kelly"
            className="inline-flex items-center gap-0.5 bg-[var(--bg)] p-1 rounded-full border border-tinta/[0.06]"
          >
            {FRACOES_DE_KELLY.map((f) => (
              <button
                key={f.valor}
                type="button"
                aria-pressed={gestao.fracao === f.valor}
                onClick={() => onGestao({ ...gestao, fracao: f.valor })}
                className={`px-2.5 py-1 min-h-[24px] text-xs font-semibold rounded-full transition-colors ${
                  gestao.fracao === f.valor
                    ? "bg-[var(--accent)] text-[var(--sobre-cor)] font-bold"
                    : "text-[var(--text-2)] hover:text-[var(--accent)]"
                }`}
              >
                {f.rotulo}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5 w-24">
          <label
            htmlFor="kelly-banca"
            className="block text-[11px] font-bold text-[var(--text-2)]"
          >
            {T.stake.banca}
          </label>
          <div className="relative">
            <input
              id="kelly-banca"
              {...banca}
              aria-invalid={!bancaValida || undefined}
              aria-describedby="kelly-banca-ajuda"
              className={`${CLASSE_CAMPO} py-1.5 pr-7 ${
                bancaValida ? "border-tinta/[0.1]" : "border-[var(--red)]"
              }`}
            />
            <span
              aria-hidden="true"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-3)] pointer-events-none"
            >
              {T.stake.sufixoDaBanca}
            </span>
          </div>
        </div>
      </div>
      <p id="kelly-banca-ajuda" className="text-[11px] text-[var(--text-3)] leading-snug">
        {T.stake.ajudaDaBanca}
      </p>
    </div>
  );
}

function Espera({ texto = T.resultado.espera }: { texto?: string }) {
  return (
    <p className="text-sm text-[var(--text-3)] text-center py-10 px-4 border border-dashed border-tinta/[0.12] rounded-xl">
      {texto}
    </p>
  );
}

/**
 * A casa de referência já está completa, mas falta a odd onde se vai apostar.
 *
 * A odd justa aparece aqui antes do resto: é o número que se leva para
 * procurar odd nas outras casas.
 */
function FaltaAEncontrada({
  oddJusta,
  campo = T.faltaAOdd.aEncontrada,
}: {
  oddJusta: number;
  campo?: string;
}) {
  return (
    <div className="space-y-2">
      <span className="block text-[10.5px] font-bold uppercase tracking-wider text-[var(--text-3)]">
        {T.faltaAOdd.titulo}
      </span>
      <div className="font-mono text-4xl font-bold leading-none text-[var(--text)]">
        {formatarOddJusta(oddJusta)}
      </div>
      <p className="text-xs text-[var(--text-2)] leading-relaxed">
        <Frase
          partes={T.faltaAOdd.frase({ campo, oddJusta: formatarOddJusta(oddJusta) })}
        />
      </p>
    </div>
  );
}

/**
 * O resultado em uma linha, só no celular, logo abaixo dos campos. Toca e vai
 * para o resultado completo.
 */
function Resumo({ tom, children }: { tom: "verde" | "vermelho"; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={() =>
        document.getElementById("resultado")?.scrollIntoView({ block: "start" })
      }
      className={`lg:hidden w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-xs font-bold focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
        tom === "verde"
          ? "bg-[var(--green-soft)] text-[var(--green)]"
          : "bg-[var(--red-soft)] text-[var(--red)]"
      }`}
    >
      <span>{children}</span>
      <span className="shrink-0 inline-flex items-center gap-1">
        {T.resumo.ver}
        <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
      </span>
    </button>
  );
}

/** O resumo dos modos que dão stake: valor esperado e unidades pelo Kelly. */
function ResumoDeValor({
  valorEsperado,
  odd,
  probabilidade,
  gestao,
}: {
  valorEsperado: number;
  odd: number;
  probabilidade: number;
  gestao: Gestao;
}) {
  const banca = lerNumeroBR(gestao.banca);
  const stake = stakeDeKelly(odd, probabilidade, gestao.fracao, banca ?? 0);
  return (
    <Resumo tom={valorEsperado > 0 ? "verde" : "vermelho"}>
      {valorEsperado > 0
        ? T.resumo.comValor({
            valor: formatarPorcentagem(valorEsperado * 100),
            unidades: banca ? formatarUnidadesSemSinal(stake.unidades) : "",
          })
        : T.resumo.semValor(porcento(valorEsperado, 2))}
    </Resumo>
  );
}

function ResultadoDaSurebet({
  investimento,
  odds,
  passo,
}: {
  investimento: number;
  odds: number[];
  passo: number;
}) {
  const r = calcularSurebet(investimento, odds, passo);
  const arredondado = passo > 0.01;
  if (r.existe && !r.ehSurebet) {
    // As odds fecham abaixo de 100%, mas as apostas arredondadas não: dizer
    // "não há surebet" aqui seria mentir sobre o mercado.
    return (
      <div className="space-y-2">
        <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[var(--red-soft)] text-[var(--red)]">
          {T.surebet.selo.semLucro}
        </span>
        <p className="text-sm text-[var(--text-2)] leading-relaxed">
          <Frase
            partes={T.surebet.semLucro({
              soma: porcento(1 + margem(odds)),
              investimento: formatarReais(investimento),
              arredondado,
            })}
          />
        </p>
      </div>
    );
  }
  if (!r.ehSurebet) {
    return (
      <div className="space-y-2">
        <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[var(--red-soft)] text-[var(--red)]">
          {T.surebet.selo.naoHa}
        </span>
        <p className="text-sm text-[var(--text-2)] leading-relaxed">
          <Frase
            partes={T.surebet.naoHa({
              soma: porcento(1 + margem(odds)),
              perda: formatarReais(Math.abs(r.lucro)),
            })}
          />
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[var(--green-soft)] text-[var(--green)]">
          {T.surebet.selo.existe}
        </span>
        <div className="font-serif text-5xl tracking-tight leading-none text-[var(--green)]">
          {formatarPorcentagem(r.roi * 100)}
        </div>
        <p className="text-xs text-[var(--text-2)] leading-relaxed">
          <Frase
            partes={T.surebet.lucro({
              lucro: formatarReais(r.lucro),
              maximo: formatarReais(r.lucroMaximo),
              temMaximo: arredondado && r.lucroMaximo > r.lucro,
              investido: formatarReais(r.investido),
              temInvestido: r.investido !== investimento,
            })}
          />
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <caption className="sr-only">{T.surebet.tabela.legenda}</caption>
          <thead className="text-[10.5px] uppercase tracking-wider text-[var(--text-3)]">
            <tr>
              <th scope="col" className="text-left font-bold pb-2">
                {T.surebet.tabela.resultado}
              </th>
              <th scope="col" className="text-right font-bold pb-2">
                {T.surebet.tabela.odd}
              </th>
              <th scope="col" className="text-right font-bold pb-2">
                {T.surebet.tabela.apostar}
              </th>
              <th scope="col" className="text-right font-bold pb-2">
                {T.surebet.tabela.retorno}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tinta/[0.06] font-mono">
            {r.apostas.map((a, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: a linha é o resultado na posição em que foi digitado.
              <tr key={i}>
                <td className="py-2 font-sans font-semibold text-[var(--text-2)]">
                  {i + 1}
                </td>
                <td className="py-2 text-right text-[var(--text-2)]">
                  {formatarOddExata(a.odd)}
                </td>
                <td className="py-2 text-right font-bold text-[var(--text)]">
                  {formatarReais(a.valor)}
                </td>
                <td className="py-2 text-right text-[var(--text-2)]">
                  {formatarReais(a.retorno)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * A calculadora de valor esperado (#71): odd justa, hold, surebet e múltiplas.
 *
 * As contas moram em lib/calculadora.ts e o formato dos campos em
 * lib/digitacao.ts; aqui é só campo e resultado. Os campos guardam o texto
 * digitado, e a leitura acontece a cada desenho: o resultado aparece sozinho
 * quando o último campo fica válido, sem botão de calcular. Antes disso, assim
 * que a casa de referência está completa, a odd justa já aparece (#82).
 *
 * Cada modo guarda os próprios campos, então trocar de modo e voltar não apaga
 * o que foi digitado. O modo vai para o endereço, para o link abrir nele.
 */
export function CalculadoraEV() {
  const [modo, setModo] = useState<Modo>("justa");

  useEstadoNaUrl({ modo: modo === "justa" ? "" : modo }, (lidos) => {
    const lido = escolher(lidos.modo, MODOS);
    if (lido) setModo(lido);
  });

  const [justa, setJusta] = useState(JUSTA_VAZIA);
  const [hold, setHold] = useState(HOLD_VAZIO);
  const [surebet, setSurebet] = useState(SUREBET_VAZIA);
  const [selecoes, setSelecoes] = useState<SelecaoDigitada[]>([
    SELECAO_VAZIA,
    SELECAO_VAZIA,
  ]);
  const [oddMultipla, setOddMultipla] = useState("");

  // Fração do Kelly e banca: valem para os três modos que dão stake, e ficam
  // guardadas no navegador. Lidas depois da montagem, para o servidor e a
  // primeira pintura do navegador desenharem igual.
  const [gestao, setGestao] = useState<Gestao>(GESTAO_PADRAO);
  useEffect(() => {
    try {
      const salva = JSON.parse(window.localStorage.getItem(CHAVE_GESTAO) ?? "null");
      if (
        salva &&
        FRACOES_DE_KELLY.some((f) => f.valor === salva.fracao) &&
        typeof salva.banca === "string"
      ) {
        setGestao({ fracao: salva.fracao, banca: salva.banca });
      }
    } catch {
      // Armazenamento bloqueado ou valor estragado: fica o padrão.
    }
  }, []);
  const mudarGestao = (nova: Gestao) => {
    setGestao(nova);
    try {
      window.localStorage.setItem(CHAVE_GESTAO, JSON.stringify(nova));
    } catch {
      // Sem armazenamento, a escolha vale só até recarregar.
    }
  };

  const limpar = () => {
    if (modo === "justa") setJusta(JUSTA_VAZIA);
    else if (modo === "hold") setHold(HOLD_VAZIO);
    else if (modo === "surebet") setSurebet(SUREBET_VAZIA);
    else {
      setSelecoes([SELECAO_VAZIA, SELECAO_VAZIA]);
      setOddMultipla("");
    }
  };

  let campos: ReactNode;
  let ajuda: ReactNode;
  let resultado: ReactNode;
  // No celular o resultado fica embaixo de todos os campos, e com o teclado
  // aberto ninguém o vê. O resumo vai logo depois do último campo.
  let resumo: ReactNode = null;

  if (modo === "justa") {
    const lida = lerSelecao(justa);
    const encontrada = lerCampoDeOdd(justa.encontrada);

    campos = (
      <>
        <Bloco
          titulo={T.referencia.titulo}
          descricao={T.referencia.descricaoDaJusta}
          acao={
            <SeletorDeResultados
              id="justa-resultados"
              rotulo={T.mercado.aria}
              valor={justa.resultados}
              maximo={MAXIMO_DE_RESULTADOS}
              onChange={(resultados) => setJusta({ ...justa, resultados })}
            />
          }
        >
          <OddsDoMercado
            prefixo="justa"
            selecao={justa}
            lida={lida}
            onChange={(s) => setJusta({ ...justa, ...s })}
          />
        </Bloco>
        <Bloco titulo={T.onde.titulo} descricao={T.onde.descricao}>
          <div className="grid grid-cols-2 gap-3 sm:max-w-sm items-start">
            <Campo
              id="justa-encontrada"
              rotulo={T.mercado.encontrada}
              exemplo="2,10"
              destaque
              valor={justa.encontrada}
              erro={encontrada.erro}
              onChange={(v) => setJusta({ ...justa, encontrada: v })}
            />
            <OddDeComparacao rotulo={T.mercado.oddJusta} odd={lida.oddJusta} />
          </div>
        </Bloco>
      </>
    );
    ajuda = (
      <ComoUsar
        onExemplo={() =>
          setJusta({
            ...exemploDeSelecao(3, "2,00", ["3,40", "3,60"]),
            encontrada: "2,50",
          })
        }
      >
        <p>
          <Frase partes={T.justa.ajuda1()} forte="" />
        </p>
        <p>{T.justa.ajuda2}</p>
        <p>{T.justa.ajuda3}</p>
      </ComoUsar>
    );

    if (lida.oddJusta !== null && encontrada.valor !== null) {
      const r = calcularOddJusta(
        lida.analisada.valor as number,
        lida.contrarias.map((c) => c.valor as number),
        encontrada.valor
      );
      resultado = (
        <div className="space-y-5">
          <Veredito valorEsperado={r.valorEsperado} oddJusta={r.oddJusta} />
          <StakeRecomendada
            odd={encontrada.valor}
            probabilidade={r.probabilidadeJusta}
            gestao={gestao}
            onGestao={mudarGestao}
          />
          <dl className="grid grid-cols-2 gap-2">
            <Detalhe rotulo={T.detalhes.oddJusta} valor={formatarOddJusta(r.oddJusta)} />
            <Detalhe
              rotulo={T.detalhes.probabilidade}
              valor={porcento(r.probabilidadeJusta, 1)}
            />
            <Detalhe rotulo={T.detalhes.margem} valor={porcento(r.margem)} />
            <Detalhe rotulo={T.detalhes.payout} valor={porcento(r.payout, 1)} />
          </dl>
        </div>
      );
      resumo = (
        <ResumoDeValor
          valorEsperado={r.valorEsperado}
          odd={encontrada.valor}
          probabilidade={r.probabilidadeJusta}
          gestao={gestao}
        />
      );
    } else if (lida.oddJusta !== null) {
      resultado = <FaltaAEncontrada oddJusta={lida.oddJusta} />;
    }
  } else if (modo === "hold") {
    const base = lerCampoDeOdd(hold.base);
    const margemLida = lerPorcentagem(hold.margem);
    const erroMargem = hold.margem.trim() !== "" && margemLida === null;
    const encontrada = lerCampoDeOdd(hold.encontrada);
    const oddJusta =
      base.valor !== null && margemLida !== null
        ? base.valor * (1 + margemLida / 100)
        : null;

    campos = (
      <>
        <Bloco titulo={T.referencia.titulo} descricao={T.referencia.descricaoDoHold}>
          <div className="grid grid-cols-2 gap-3 sm:max-w-sm items-start">
            <Campo
              id="hold-base"
              rotulo={T.hold.base}
              exemplo="1,90"
              destaque
              valor={hold.base}
              erro={base.erro}
              onChange={(v) => setHold({ ...hold, base: v })}
            />
            <Campo
              id="hold-margem"
              rotulo={T.hold.margem}
              exemplo="4"
              tipo="porcentagem"
              sufixo={T.hold.sufixo}
              valor={hold.margem}
              erro={erroMargem}
              onChange={(v) => setHold({ ...hold, margem: v })}
            />
          </div>
        </Bloco>
        <Bloco titulo={T.onde.titulo} descricao={T.onde.descricao}>
          <div className="grid grid-cols-2 gap-3 sm:max-w-sm items-start">
            <Campo
              id="hold-encontrada"
              rotulo={T.mercado.encontrada}
              exemplo="2,10"
              destaque
              valor={hold.encontrada}
              erro={encontrada.erro}
              onChange={(v) => setHold({ ...hold, encontrada: v })}
            />
            <OddDeComparacao rotulo={T.mercado.oddJusta} odd={oddJusta} />
          </div>
        </Bloco>
      </>
    );
    ajuda = (
      <ComoUsar
        onExemplo={() => setHold({ base: "1,90", margem: "4", encontrada: "2,10" })}
      >
        <p>{T.hold.ajuda1}</p>
        <p>{T.hold.ajuda2}</p>
      </ComoUsar>
    );

    if (base.valor !== null && margemLida !== null && encontrada.valor !== null) {
      const r = calcularPorHold(base.valor, margemLida, encontrada.valor);
      resultado = (
        <div className="space-y-5">
          <Veredito valorEsperado={r.valorEsperado} oddJusta={r.oddJusta} />
          <StakeRecomendada
            odd={encontrada.valor}
            probabilidade={r.probabilidadeJusta}
            gestao={gestao}
            onGestao={mudarGestao}
          />
          <dl className="grid grid-cols-2 gap-2">
            <Detalhe rotulo={T.detalhes.oddJusta} valor={formatarOddJusta(r.oddJusta)} />
            <Detalhe
              rotulo={T.detalhes.probabilidade}
              valor={porcento(r.probabilidadeJusta, 1)}
            />
            <Detalhe rotulo={T.detalhes.margem} valor={porcento(margemLida / 100)} />
            <Detalhe
              rotulo={T.detalhes.payout}
              valor={porcento(1 / (1 + margemLida / 100), 1)}
            />
          </dl>
        </div>
      );
      resumo = (
        <ResumoDeValor
          valorEsperado={r.valorEsperado}
          odd={encontrada.valor}
          probabilidade={r.probabilidadeJusta}
          gestao={gestao}
        />
      );
    } else if (oddJusta !== null) {
      resultado = <FaltaAEncontrada oddJusta={oddJusta} />;
    }
  } else if (modo === "surebet") {
    const investimento = lerNumeroBR(surebet.investimento);
    const erroInvestimento = surebet.investimento.trim() !== "" && investimento === null;
    const odds = surebet.odds.slice(0, surebet.resultados).map(lerCampoDeOdd);

    campos = (
      <>
        <Bloco
          titulo={T.surebet.odds.titulo}
          descricao={T.surebet.odds.descricao}
          acao={
            <SeletorDeResultados
              id="surebet-resultados"
              rotulo={T.mercado.aria}
              valor={surebet.resultados}
              maximo={MAXIMO_DE_RESULTADOS_NA_SUREBET}
              onChange={(resultados) => setSurebet({ ...surebet, resultados })}
            />
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-start">
            {odds.map((o, i) => (
              <Campo
                // biome-ignore lint/suspicious/noArrayIndexKey: a posição é a identidade do campo, e a lista só cresce e encolhe pelo fim.
                key={i}
                id={`surebet-odd-${i + 1}`}
                rotulo={T.surebet.odd(i + 1)}
                exemplo={["2,08", "2,02", "3,60", "4,50"][i]}
                valor={surebet.odds[i]}
                erro={o.erro}
                onChange={(v) => {
                  const novas = [...surebet.odds];
                  novas[i] = v;
                  setSurebet({ ...surebet, odds: novas });
                }}
              />
            ))}
          </div>
        </Bloco>
        <Bloco
          titulo={T.surebet.investir.titulo}
          descricao={T.surebet.investir.descricao}
        >
          <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
            <div className="w-44 max-w-full">
              <Campo
                id="surebet-investimento"
                rotulo={T.surebet.investimento}
                exemplo="100,00"
                tipo="reais"
                valor={surebet.investimento}
                erro={erroInvestimento}
                onChange={(v) => setSurebet({ ...surebet, investimento: v })}
              />
            </div>
            <div className="space-y-1.5">
              <span
                id="rotulo-arredondar"
                className="block text-xs font-bold text-[var(--text)]"
              >
                {T.surebet.arredondar}
              </span>
              {/* biome-ignore lint/a11y/useSemanticElements: o que a regra pede no lugar é <fieldset>, que chega com borda, margem e padding do navegador; aqui é uma barra de botões, como as outras do site. */}
              <div
                role="group"
                aria-labelledby="rotulo-arredondar"
                className="inline-flex items-center gap-0.5 bg-[var(--bg)] p-1 rounded-full border border-tinta/[0.06]"
              >
                {PASSOS_DA_SUREBET.map((p) => (
                  <button
                    key={p.valor}
                    type="button"
                    aria-pressed={surebet.passo === p.valor}
                    onClick={() => setSurebet({ ...surebet, passo: p.valor })}
                    className={`px-3 py-1.5 min-h-[28px] text-xs font-semibold rounded-full transition-colors ${
                      surebet.passo === p.valor
                        ? "bg-[var(--accent)] text-[var(--sobre-cor)] font-bold"
                        : "text-[var(--text-2)] hover:text-[var(--accent)]"
                    }`}
                  >
                    {p.rotulo}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Bloco>
      </>
    );
    ajuda = (
      <ComoUsar
        onExemplo={() =>
          setSurebet({
            ...SUREBET_VAZIA,
            odds: ["2,08", "2,02", "", ""],
          })
        }
      >
        <p>{T.surebet.ajuda1}</p>
        <p>{T.surebet.ajuda2}</p>
        <p>{T.surebet.ajuda3}</p>
      </ComoUsar>
    );

    if (investimento !== null && odds.every((o) => o.valor !== null)) {
      const valores = odds.map((o) => o.valor as number);
      resultado = (
        <ResultadoDaSurebet
          investimento={investimento}
          odds={valores}
          passo={surebet.passo}
        />
      );
      const r = calcularSurebet(investimento, valores, surebet.passo);
      resumo = (
        <Resumo tom={r.ehSurebet ? "verde" : "vermelho"}>
          {r.ehSurebet
            ? T.surebet.resumo.comLucro({
                roi: formatarPorcentagem(r.roi * 100),
                lucro: formatarReais(r.lucro),
              })
            : r.existe
              ? T.surebet.resumo.semLucro
              : T.surebet.resumo.naoHa}
        </Resumo>
      );
    }
  } else {
    const lidas = selecoes.map(lerSelecao);
    const multipla = lerCampoDeOdd(oddMultipla);
    const oddJusta = lidas.every((l) => l.oddJusta !== null)
      ? lidas.reduce((acc, l) => acc * (l.oddJusta as number), 1)
      : null;

    const mudar = (i: number, nova: SelecaoDigitada) =>
      setSelecoes(selecoes.map((s, j) => (j === i ? nova : s)));

    campos = (
      <>
        <Bloco
          titulo={T.multipla.selecoes.titulo}
          descricao={T.multipla.selecoes.descricao}
        >
          <div className="space-y-3">
            {selecoes.map((s, i) => (
              <fieldset
                // biome-ignore lint/suspicious/noArrayIndexKey: a seleção é identificada pela posição, que é o número que a tela mostra.
                key={i}
                className="rounded-xl border border-dashed border-tinta/[0.14] p-4 space-y-3 min-w-0"
              >
                {/* A legenda tem de ser a primeira filha do fieldset para nomear o
                    grupo; a que se vê fica na linha dos controles. */}
                <legend className="sr-only">{T.multipla.selecao(i + 1)}</legend>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span
                    aria-hidden="true"
                    className="text-sm font-bold text-[var(--text)]"
                  >
                    {T.multipla.selecao(i + 1)}
                  </span>
                  <div className="flex items-center gap-2">
                    <SeletorDeResultados
                      id={`multipla-${i + 1}-resultados`}
                      rotulo={T.multipla.resultadosDaSelecao(i + 1)}
                      valor={s.resultados}
                      maximo={MAXIMO_DE_RESULTADOS}
                      onChange={(resultados) => mudar(i, { ...s, resultados })}
                    />
                    {selecoes.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setSelecoes(selecoes.filter((_, j) => j !== i))}
                        aria-label={T.multipla.remover(i + 1)}
                        className="p-1.5 min-h-[24px] min-w-[24px] rounded-full text-[var(--text-3)] hover:bg-[var(--red-soft)] hover:text-[var(--red)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
                <OddsDoMercado
                  prefixo={`multipla-${i + 1}`}
                  selecao={s}
                  lida={lidas[i]}
                  onChange={(nova) => mudar(i, nova)}
                />
                {lidas[i].oddJusta !== null && (
                  <p className="text-right text-xs text-[var(--text-2)]">
                    <Frase
                      partes={T.multipla.oddJustaDaSelecao(
                        formatarOddJusta(lidas[i].oddJusta as number)
                      )}
                      forte="font-mono text-[var(--text)]"
                    />
                  </p>
                )}
              </fieldset>
            ))}

            {selecoes.length < MAXIMO_DE_SELECOES && (
              <button
                type="button"
                onClick={() => setSelecoes([...selecoes, SELECAO_VAZIA])}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-tinta/[0.1] bg-[var(--bg-soft)] text-xs font-bold text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] active:transform-none transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                {T.multipla.adicionar}
              </button>
            )}
          </div>
        </Bloco>

        <Bloco titulo={T.onde.titulo} descricao={T.onde.descricaoDaMultipla}>
          <div className="grid grid-cols-2 gap-3 sm:max-w-sm items-start">
            <Campo
              id="multipla-odd"
              rotulo={T.multipla.odd}
              exemplo="4,60"
              destaque
              valor={oddMultipla}
              erro={multipla.erro}
              onChange={setOddMultipla}
            />
            <OddDeComparacao rotulo={T.mercado.oddJusta} odd={oddJusta} />
          </div>
        </Bloco>
      </>
    );
    ajuda = (
      <ComoUsar
        onExemplo={() => {
          setSelecoes([
            exemploDeSelecao(2, "1,90", ["1,90"]),
            exemploDeSelecao(3, "2,00", ["3,40", "3,60"]),
          ]);
          setOddMultipla("4,60");
        }}
      >
        <p>{T.multipla.ajuda1}</p>
        <p>{T.multipla.ajuda2}</p>
        <p>{T.multipla.ajuda3}</p>
      </ComoUsar>
    );

    if (oddJusta !== null && multipla.valor !== null) {
      const r = calcularMultipla(
        lidas.map((l) => ({
          analisada: l.analisada.valor as number,
          contrarias: l.contrarias.map((c) => c.valor as number),
        })),
        multipla.valor
      );
      resultado = (
        <div className="space-y-5">
          <Veredito valorEsperado={r.valorEsperado} oddJusta={r.oddJusta} />
          <StakeRecomendada
            odd={multipla.valor}
            probabilidade={r.probabilidadeJusta}
            gestao={gestao}
            onGestao={mudarGestao}
          />
          <dl className="grid grid-cols-2 gap-2">
            <Detalhe rotulo={T.detalhes.oddJusta} valor={formatarOddJusta(r.oddJusta)} />
            <Detalhe
              rotulo={T.detalhes.probabilidade}
              valor={porcento(r.probabilidadeJusta, 1)}
            />
          </dl>
          <ul className="text-xs text-[var(--text-2)] space-y-1">
            {r.oddsJustas.map((o, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: a linha é a seleção na posição dela.
              <li key={i} className="flex justify-between gap-3">
                <span>{T.multipla.selecao(i + 1)}</span>
                <span className="font-mono font-bold text-[var(--text)]">
                  {T.multipla.oddJustaNaLista(formatarOddJusta(o))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      );
      resumo = (
        <ResumoDeValor
          valorEsperado={r.valorEsperado}
          odd={multipla.valor}
          probabilidade={r.probabilidadeJusta}
          gestao={gestao}
        />
      );
    } else if (oddJusta !== null) {
      resultado = (
        <FaltaAEncontrada oddJusta={oddJusta} campo={T.faltaAOdd.aDaMultipla} />
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* biome-ignore lint/a11y/useSemanticElements: o que a regra pede no lugar é <fieldset>, que traz borda, margem e padding do navegador; aqui é a barra que troca o modo da tela, como as outras barras de botões do site. */}
      <div
        role="group"
        aria-label={T.ariaDosModos}
        className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-[var(--bg-soft)] p-1 rounded-2xl border border-tinta/[0.05]"
      >
        {MODOS.map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={modo === m}
            onClick={() => setModo(m)}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors ${
              modo === m
                ? "bg-[var(--pilula)] text-[var(--text)] shadow-sm"
                : "text-[var(--text-2)] hover:text-[var(--accent)]"
            }`}
          >
            {T.modos[m]}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <section
          aria-labelledby="titulo-dados"
          className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-5 sm:p-6 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between gap-3 -mb-2">
            <h2
              id="titulo-dados"
              className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]"
            >
              {T.dados.titulo}
            </h2>
            <button
              type="button"
              onClick={limpar}
              className="px-2.5 py-1 -my-1 -mr-2.5 rounded-full text-xs font-bold text-[var(--text-2)] hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors"
            >
              {T.dados.limpar}
            </button>
          </div>
          {campos}
          {resumo}
          {ajuda}
        </section>

        {/* aria-live: quem usa leitor de tela ouve o resultado quando o último
            campo fica válido, sem precisar ir procurá-lo. */}
        <section
          id="resultado"
          aria-label={T.resultado.titulo}
          aria-live="polite"
          className="scroll-mt-24 bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-5 sm:p-6 shadow-sm lg:sticky lg:top-24"
        >
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-4">
            {T.resultado.titulo}
          </h2>
          {resultado ?? <Espera />}
        </section>
      </div>
    </div>
  );
}
