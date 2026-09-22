"use client";

import { type ReactNode, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useEstadoNaUrl } from "@/hooks/useEstadoNaUrl";
import { escolher } from "@/lib/endereco";
import { formatarOdd, formatarReais, lerNumeroBR } from "@/lib/format";
import {
  calcularMultipla,
  calcularOddJusta,
  calcularPorHold,
  calcularSurebet,
  lerOdd,
  lerPorcentagem,
  margem,
} from "@/lib/calculadora";

const MODOS = [
  { id: "justa", rotulo: "Odd justa" },
  { id: "hold", rotulo: "Hold" },
  { id: "surebet", rotulo: "Surebet" },
  { id: "multipla", rotulo: "Múltiplas" },
] as const;

type Modo = (typeof MODOS)[number]["id"];
type Resultados = 2 | 3;

/** Seleção como está digitada: texto cru, lido só na hora da conta. */
interface SelecaoDigitada {
  resultados: Resultados;
  analisada: string;
  contrarias: [string, string];
}

const SELECAO_VAZIA: SelecaoDigitada = {
  resultados: 2,
  analisada: "",
  contrarias: ["", ""],
};

const MAXIMO_DE_SELECOES = 10;

/** 0,0526 → "5,26%"; com `sinal`, positivo ganha "+". */
function porcento(fracao: number, casas = 2, sinal = false): string {
  const texto = `${(fracao * 100).toFixed(casas).replace(".", ",")}%`;
  return sinal && fracao > 0 ? `+${texto}` : texto;
}

/** Odd lida de um campo, e se o campo mostra erro: só quando há texto e ele não é odd. */
function lerCampoDeOdd(texto: string): { valor: number | null; erro: boolean } {
  const valor = lerOdd(texto);
  return { valor, erro: texto.trim() !== "" && valor === null };
}

const CLASSE_CAMPO =
  "w-full bg-[var(--bg)] border rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-[var(--text)] placeholder:font-normal placeholder:text-[var(--text-3)] outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors";

function Campo({
  id,
  rotulo,
  valor,
  onChange,
  exemplo,
  dica,
  erro,
  mensagemDeErro = "Use um número maior que 1, como 1,85.",
  sufixo,
}: {
  id: string;
  rotulo: string;
  valor: string;
  onChange: (valor: string) => void;
  exemplo: string;
  dica?: string;
  erro?: boolean;
  mensagemDeErro?: string;
  sufixo?: string;
}) {
  const idAjuda = `${id}-ajuda`;
  return (
    <div className="space-y-1.5 min-w-0">
      <label htmlFor={id} className="block text-xs font-bold text-[var(--text)]">
        {rotulo}
      </label>
      <div className="relative">
        {/* type="text" com teclado decimal, como o campo de unidade: o
            type="number" joga fora o valor que chega com vírgula em parte dos
            navegadores. */}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={`ex.: ${exemplo}`}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={erro || undefined}
          aria-describedby={dica || erro ? idAjuda : undefined}
          className={`${CLASSE_CAMPO} ${sufixo ? "pr-9" : ""} ${
            erro ? "border-[var(--red)]" : "border-tinta/[0.1]"
          }`}
        />
        {sufixo && (
          <span
            aria-hidden="true"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-3)] pointer-events-none"
          >
            {sufixo}
          </span>
        )}
      </div>
      {(dica || erro) && (
        <p
          id={idAjuda}
          className={`text-[11.5px] leading-snug ${
            erro ? "text-[var(--red)] font-semibold" : "text-[var(--text-3)]"
          }`}
        >
          {erro ? mensagemDeErro : dica}
        </p>
      )}
    </div>
  );
}

function EscolhaDeResultados({
  valor,
  onChange,
  rotulo,
}: {
  valor: Resultados;
  onChange: (valor: Resultados) => void;
  rotulo: string;
}) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: o que a regra pede no lugar é <fieldset>, que chega com borda, margem e padding do navegador e existe para agrupar campo de formulário; aqui é uma barra de dois botões, como as outras do site.
    <div
      role="group"
      aria-label={rotulo}
      className="inline-flex items-center gap-1 bg-[var(--bg)] p-1 rounded-full border border-tinta/[0.06]"
    >
      {([2, 3] as const).map((n) => (
        <button
          key={n}
          type="button"
          aria-pressed={valor === n}
          onClick={() => onChange(n)}
          className={`px-3 py-1 min-h-[24px] text-xs font-semibold rounded-full transition-colors ${
            valor === n
              ? "bg-[var(--accent)] text-[var(--sobre-cor)] font-bold"
              : "text-[var(--text-2)] hover:text-[var(--accent)]"
          }`}
        >
          {n === 2 ? "2 resultados" : "3 resultados (1X2)"}
        </button>
      ))}
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
        Como usar
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
          Preencher com o exemplo
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
        {temValor ? "Aposta de valor" : "Sem valor"}
      </span>
      <div
        className={`font-serif text-5xl tracking-tight leading-none ${
          temValor ? "text-[var(--green)]" : "text-[var(--red)]"
        }`}
      >
        {porcento(valorEsperado, 2, true)}
      </div>
      <p className="text-xs text-[var(--text-2)] leading-relaxed">
        Valor esperado. A cada {formatarReais(100)} apostados nessa odd, o retorno médio é
        de{" "}
        <strong className="text-[var(--text)]">
          {formatarReais(100 * (1 + valorEsperado))}
        </strong>
        . Tem valor qualquer odd acima de{" "}
        <strong className="text-[var(--text)]">{formatarOdd(oddJusta)}</strong>.
      </p>
    </div>
  );
}

function Espera({
  texto = "Preencha as odds para ver o resultado.",
}: {
  texto?: string;
}) {
  return (
    <p className="text-sm text-[var(--text-3)] text-center py-10 px-4 border border-dashed border-tinta/[0.12] rounded-xl">
      {texto}
    </p>
  );
}

/**
 * A calculadora de valor esperado (#71): odd justa, hold, surebet e múltiplas.
 *
 * As contas moram em lib/calculadora.ts; aqui é só campo e resultado. Os campos
 * guardam o texto digitado, e a leitura acontece a cada desenho: o resultado
 * aparece sozinho quando o último campo fica válido, sem botão de calcular.
 *
 * Cada modo guarda os próprios campos, então trocar de modo e voltar não apaga
 * o que foi digitado. O modo vai para o endereço, para o link abrir nele.
 */
export function CalculadoraEV() {
  const [modo, setModo] = useState<Modo>("justa");

  useEstadoNaUrl({ modo: modo === "justa" ? "" : modo }, (lidos) => {
    const lido = escolher(
      lidos.modo,
      MODOS.map((m) => m.id)
    );
    if (lido) setModo(lido);
  });

  // Odd justa
  const [justa, setJusta] = useState<SelecaoDigitada & { encontrada: string }>({
    ...SELECAO_VAZIA,
    encontrada: "",
  });
  // Hold
  const [hold, setHold] = useState({ base: "", margem: "", encontrada: "" });
  // Surebet
  const [surebet, setSurebet] = useState<{
    investimento: string;
    resultados: Resultados;
    odds: [string, string, string];
  }>({ investimento: "100", resultados: 2, odds: ["", "", ""] });
  // Múltiplas
  const [selecoes, setSelecoes] = useState<SelecaoDigitada[]>([
    SELECAO_VAZIA,
    SELECAO_VAZIA,
  ]);
  const [oddMultipla, setOddMultipla] = useState("");

  let campos: ReactNode;
  let resultado: ReactNode;

  if (modo === "justa") {
    const analisada = lerCampoDeOdd(justa.analisada);
    const contrarias = justa.contrarias.slice(0, justa.resultados - 1).map(lerCampoDeOdd);
    const encontrada = lerCampoDeOdd(justa.encontrada);
    const pronto =
      analisada.valor !== null &&
      encontrada.valor !== null &&
      contrarias.every((c) => c.valor !== null);

    campos = (
      <div className="space-y-5">
        <EscolhaDeResultados
          rotulo="Resultados do mercado"
          valor={justa.resultados}
          onChange={(resultados) => setJusta({ ...justa, resultados })}
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <Campo
            id="justa-analisada"
            rotulo="Odd analisada"
            exemplo="1,90"
            dica="Na casa de referência, a odd do resultado em que você quer apostar."
            valor={justa.analisada}
            erro={analisada.erro}
            onChange={(v) => setJusta({ ...justa, analisada: v })}
          />
          {contrarias.map((c, i) => (
            <Campo
              // biome-ignore lint/suspicious/noArrayIndexKey: a posição é a identidade do campo, e a lista só cresce e encolhe pelo fim.
              key={i}
              id={`justa-contraria-${i + 1}`}
              rotulo={justa.resultados === 2 ? "Odd contrária" : `Odd contrária ${i + 1}`}
              exemplo={i === 0 ? "1,90" : "3,60"}
              dica={
                i === 0 ? "Na mesma casa, a odd do outro lado do mercado." : undefined
              }
              valor={justa.contrarias[i]}
              erro={c.erro}
              onChange={(v) => {
                const novas: [string, string] = [...justa.contrarias];
                novas[i] = v;
                setJusta({ ...justa, contrarias: novas });
              }}
            />
          ))}
        </div>
        <div className="pt-4 border-t border-tinta/[0.06]">
          <Campo
            id="justa-encontrada"
            rotulo="Odd encontrada"
            exemplo="2,10"
            dica="A odd que você vai apostar, em outra casa."
            valor={justa.encontrada}
            erro={encontrada.erro}
            onChange={(v) => setJusta({ ...justa, encontrada: v })}
          />
        </div>
        <ComoUsar
          onExemplo={() =>
            setJusta({
              resultados: 3,
              analisada: "2,00",
              contrarias: ["3,40", "3,60"],
              encontrada: "2,50",
            })
          }
        >
          <p>
            Pegue as odds de <strong>todos</strong> os resultados de um mercado numa casa
            de margem baixa, que serve de referência. A calculadora tira a margem dela e
            chega à probabilidade real de cada resultado.
          </p>
          <p>
            Depois compare com a odd que você achou em outra casa. Se ela pagar mais que a
            odd justa, a aposta tem valor.
          </p>
          <p>
            Exemplo com 1X2: casa de referência com 2,00 / 3,40 / 3,60 e 2,50 encontrada
            para o mandante.
          </p>
        </ComoUsar>
      </div>
    );

    if (pronto && analisada.valor !== null && encontrada.valor !== null) {
      const r = calcularOddJusta(
        analisada.valor,
        contrarias.map((c) => c.valor as number),
        encontrada.valor
      );
      resultado = (
        <div className="space-y-5">
          <Veredito valorEsperado={r.valorEsperado} oddJusta={r.oddJusta} />
          <dl className="grid grid-cols-2 gap-2">
            <Detalhe rotulo="Odd justa" valor={formatarOdd(r.oddJusta)} />
            <Detalhe rotulo="Probabilidade" valor={porcento(r.probabilidadeJusta, 1)} />
            <Detalhe rotulo="Margem da casa" valor={porcento(r.margem)} />
            <Detalhe rotulo="Payout" valor={porcento(r.payout, 1)} />
          </dl>
        </div>
      );
    }
  } else if (modo === "hold") {
    const base = lerCampoDeOdd(hold.base);
    const margemLida = lerPorcentagem(hold.margem);
    const erroMargem = hold.margem.trim() !== "" && margemLida === null;
    const encontrada = lerCampoDeOdd(hold.encontrada);

    campos = (
      <div className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Campo
            id="hold-base"
            rotulo="Odd de referência"
            exemplo="1,90"
            dica="A odd do resultado na casa de referência."
            valor={hold.base}
            erro={base.erro}
            onChange={(v) => setHold({ ...hold, base: v })}
          />
          <Campo
            id="hold-margem"
            rotulo="Hold (margem da casa)"
            exemplo="4"
            sufixo="%"
            dica="Quanto a casa de referência cobra de margem nesse mercado."
            valor={hold.margem}
            erro={erroMargem}
            mensagemDeErro="Use uma porcentagem entre 0 e 100, como 4 ou 4,5."
            onChange={(v) => setHold({ ...hold, margem: v })}
          />
        </div>
        <div className="pt-4 border-t border-tinta/[0.06]">
          <Campo
            id="hold-encontrada"
            rotulo="Odd encontrada"
            exemplo="2,10"
            dica="A odd que você vai apostar, em outra casa."
            valor={hold.encontrada}
            erro={encontrada.erro}
            onChange={(v) => setHold({ ...hold, encontrada: v })}
          />
        </div>
        <ComoUsar
          onExemplo={() => setHold({ base: "1,90", margem: "4", encontrada: "2,10" })}
        >
          <p>
            Para quando você só tem a odd de um lado e sabe a margem que a casa de
            referência costuma cobrar. A odd justa é a odd de referência mais essa margem.
          </p>
          <p>
            A margem que o modo “Odd justa” mostra pode ser digitada aqui: com a mesma
            odd, as duas contas chegam à mesma odd justa.
          </p>
          <p>Exemplo: odd de referência 1,90 com hold de 4% e 2,10 encontrada.</p>
        </ComoUsar>
      </div>
    );

    if (base.valor !== null && margemLida !== null && encontrada.valor !== null) {
      const r = calcularPorHold(base.valor, margemLida, encontrada.valor);
      resultado = (
        <div className="space-y-5">
          <Veredito valorEsperado={r.valorEsperado} oddJusta={r.oddJusta} />
          <dl className="grid grid-cols-2 gap-2">
            <Detalhe rotulo="Odd justa" valor={formatarOdd(r.oddJusta)} />
            <Detalhe rotulo="Probabilidade" valor={porcento(r.probabilidadeJusta, 1)} />
          </dl>
        </div>
      );
    }
  } else if (modo === "surebet") {
    const investimento = lerNumeroBR(surebet.investimento);
    const erroInvestimento = surebet.investimento.trim() !== "" && investimento === null;
    const odds = surebet.odds.slice(0, surebet.resultados).map(lerCampoDeOdd);

    campos = (
      <div className="space-y-5">
        <Campo
          id="surebet-investimento"
          rotulo="Investimento total (R$)"
          exemplo="100"
          dica="O valor que você quer dividir entre os resultados."
          valor={surebet.investimento}
          erro={erroInvestimento}
          mensagemDeErro="Use um valor em reais, como 100 ou 1.000."
          onChange={(v) => setSurebet({ ...surebet, investimento: v })}
        />
        <EscolhaDeResultados
          rotulo="Resultados do mercado"
          valor={surebet.resultados}
          onChange={(resultados) => setSurebet({ ...surebet, resultados })}
        />
        <div className="grid sm:grid-cols-3 gap-4">
          {odds.map((o, i) => (
            <Campo
              // biome-ignore lint/suspicious/noArrayIndexKey: a posição é a identidade do campo, e a lista só cresce e encolhe pelo fim.
              key={i}
              id={`surebet-odd-${i + 1}`}
              rotulo={`Odd do resultado ${i + 1}`}
              exemplo={["2,08", "2,02", "3,60"][i]}
              valor={surebet.odds[i]}
              erro={o.erro}
              onChange={(v) => {
                const novas: [string, string, string] = [...surebet.odds];
                novas[i] = v;
                setSurebet({ ...surebet, odds: novas });
              }}
            />
          ))}
        </div>
        <ComoUsar
          onExemplo={() =>
            setSurebet({ investimento: "100", resultados: 2, odds: ["2,08", "2,02", ""] })
          }
        >
          <p>
            Surebet é quando casas diferentes pagam tão bem os resultados de um mesmo
            mercado que dá para apostar em todos e lucrar saia o que sair. Cada odd vem da
            casa que paga mais por aquele resultado.
          </p>
          <p>
            A calculadora divide o investimento para o retorno ser igual em qualquer
            resultado. Arredondado ao centavo, pode variar alguns centavos de um para
            outro; o lucro mostrado é o menor.
          </p>
          <p>Exemplo: R$ 100 em mais/menos, com 2,08 numa casa e 2,02 na outra.</p>
        </ComoUsar>
      </div>
    );

    if (investimento !== null && odds.every((o) => o.valor !== null)) {
      const valores = odds.map((o) => o.valor as number);
      const r = calcularSurebet(investimento, valores);
      const somaImplicita = 1 + margem(valores);
      resultado = r.ehSurebet ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[var(--green-soft)] text-[var(--green)]">
              Surebet
            </span>
            <div className="font-serif text-5xl tracking-tight leading-none text-[var(--green)]">
              {porcento(r.roi, 2, true)}
            </div>
            <p className="text-xs text-[var(--text-2)] leading-relaxed">
              Lucro garantido de{" "}
              <strong className="text-[var(--text)]">{formatarReais(r.lucro)}</strong>,
              saia o que sair.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <caption className="sr-only">Quanto apostar em cada resultado</caption>
              <thead className="text-[10.5px] uppercase tracking-wider text-[var(--text-3)]">
                <tr>
                  <th scope="col" className="text-left font-bold pb-2">
                    Resultado
                  </th>
                  <th scope="col" className="text-right font-bold pb-2">
                    Odd
                  </th>
                  <th scope="col" className="text-right font-bold pb-2">
                    Apostar
                  </th>
                  <th scope="col" className="text-right font-bold pb-2">
                    Retorno
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
                      {formatarOdd(a.odd)}
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
      ) : (
        <div className="space-y-2">
          <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[var(--red-soft)] text-[var(--red)]">
            Não há surebet
          </span>
          <p className="text-sm text-[var(--text-2)] leading-relaxed">
            As odds somam{" "}
            <strong className="text-[var(--text)]">{porcento(somaImplicita)}</strong> de
            probabilidade. Para existir surebet, a soma precisa ficar abaixo de 100%.
            Dividindo o valor entre os resultados, você perderia{" "}
            <strong className="text-[var(--red)]">
              {formatarReais(Math.abs(r.lucro))}
            </strong>{" "}
            saia o que sair.
          </p>
        </div>
      );
    }
  } else {
    const lidas = selecoes.map((s) => ({
      analisada: lerCampoDeOdd(s.analisada),
      contrarias: s.contrarias.slice(0, s.resultados - 1).map(lerCampoDeOdd),
    }));
    const multipla = lerCampoDeOdd(oddMultipla);
    const pronto =
      multipla.valor !== null &&
      lidas.every(
        (l) => l.analisada.valor !== null && l.contrarias.every((c) => c.valor !== null)
      );

    const mudar = (i: number, nova: SelecaoDigitada) =>
      setSelecoes(selecoes.map((s, j) => (j === i ? nova : s)));

    campos = (
      <div className="space-y-4">
        {selecoes.map((s, i) => (
          <fieldset
            // biome-ignore lint/suspicious/noArrayIndexKey: a seleção é identificada pela posição, que é o número que a tela mostra.
            key={i}
            className="rounded-xl border border-dashed border-tinta/[0.14] p-4 space-y-4 min-w-0"
          >
            {/* A legenda tem de ser a primeira filha do fieldset para nomear o
                grupo; a que se vê fica na linha dos controles. */}
            <legend className="sr-only">Seleção {i + 1}</legend>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span aria-hidden="true" className="text-sm font-bold text-[var(--text)]">
                Seleção {i + 1}
              </span>
              <div className="flex items-center gap-2">
                <EscolhaDeResultados
                  rotulo={`Resultados do mercado da seleção ${i + 1}`}
                  valor={s.resultados}
                  onChange={(resultados) => mudar(i, { ...s, resultados })}
                />
                {selecoes.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setSelecoes(selecoes.filter((_, j) => j !== i))}
                    aria-label={`Remover a seleção ${i + 1}`}
                    className="p-1.5 min-h-[24px] min-w-[24px] rounded-full text-[var(--text-3)] hover:bg-[var(--red-soft)] hover:text-[var(--red)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <Campo
                id={`multipla-${i + 1}-analisada`}
                rotulo="Odd analisada"
                exemplo="1,90"
                valor={s.analisada}
                erro={lidas[i].analisada.erro}
                onChange={(v) => mudar(i, { ...s, analisada: v })}
              />
              {lidas[i].contrarias.map((c, k) => (
                <Campo
                  // biome-ignore lint/suspicious/noArrayIndexKey: a posição é a identidade do campo.
                  key={k}
                  id={`multipla-${i + 1}-contraria-${k + 1}`}
                  rotulo={s.resultados === 2 ? "Odd contrária" : `Odd contrária ${k + 1}`}
                  exemplo={k === 0 ? "1,90" : "3,60"}
                  valor={s.contrarias[k]}
                  erro={c.erro}
                  onChange={(v) => {
                    const novas: [string, string] = [...s.contrarias];
                    novas[k] = v;
                    mudar(i, { ...s, contrarias: novas });
                  }}
                />
              ))}
            </div>
          </fieldset>
        ))}

        {selecoes.length < MAXIMO_DE_SELECOES && (
          <button
            type="button"
            onClick={() => setSelecoes([...selecoes, SELECAO_VAZIA])}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-tinta/[0.1] bg-[var(--bg-soft)] text-xs font-bold text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] active:transform-none transition-colors"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Adicionar seleção
          </button>
        )}

        <div className="pt-4 border-t border-tinta/[0.06]">
          <Campo
            id="multipla-odd"
            rotulo="Odd da múltipla"
            exemplo="4,60"
            dica="A odd total que a casa oferece pela múltipla."
            valor={oddMultipla}
            erro={multipla.erro}
            onChange={setOddMultipla}
          />
        </div>

        <ComoUsar
          onExemplo={() => {
            setSelecoes([
              { resultados: 2, analisada: "1,90", contrarias: ["1,90", ""] },
              { resultados: 3, analisada: "2,00", contrarias: ["3,40", "3,60"] },
            ]);
            setOddMultipla("4,60");
          }}
        >
          <p>
            Para cada seleção, as odds de todos os resultados do mercado na casa de
            referência. A calculadora acha a odd justa de cada uma e multiplica.
          </p>
          <p>
            Depois compara com a odd que a casa paga pela múltipla. Vale para seleções de
            jogos diferentes: na mesma partida (criar aposta) os resultados se
            influenciam, e multiplicar deixa de ser a conta certa.
          </p>
          <p>
            Exemplo: um mais/menos a 1,90 / 1,90 e um 1X2 a 2,00 / 3,40 / 3,60, pagos a
            4,60.
          </p>
        </ComoUsar>
      </div>
    );

    if (pronto && multipla.valor !== null) {
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
          <dl className="grid grid-cols-2 gap-2">
            <Detalhe rotulo="Odd justa" valor={formatarOdd(r.oddJusta)} />
            <Detalhe rotulo="Probabilidade" valor={porcento(r.probabilidadeJusta, 1)} />
          </dl>
          <ul className="text-xs text-[var(--text-2)] space-y-1">
            {r.oddsJustas.map((o, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: a linha é a seleção na posição dela.
              <li key={i} className="flex justify-between gap-3">
                <span>Seleção {i + 1}</span>
                <span className="font-mono font-bold text-[var(--text)]">
                  odd justa {formatarOdd(o)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* biome-ignore lint/a11y/useSemanticElements: o que a regra pede no lugar é <fieldset>, que traz borda, margem e padding do navegador; aqui é a barra que troca o modo da tela, como as outras barras de botões do site. */}
      <div
        role="group"
        aria-label="Modo da calculadora"
        className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-[var(--bg-soft)] p-1 rounded-2xl border border-tinta/[0.05]"
      >
        {MODOS.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={modo === m.id}
            onClick={() => setModo(m.id)}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors ${
              modo === m.id
                ? "bg-[var(--pilula)] text-[var(--text)] shadow-sm"
                : "text-[var(--text-2)] hover:text-[var(--accent)]"
            }`}
          >
            {m.rotulo}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <section
          aria-label="Dados da aposta"
          className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-5 sm:p-6 shadow-sm"
        >
          {campos}
        </section>

        {/* aria-live: quem usa leitor de tela ouve o resultado quando o último
            campo fica válido, sem precisar ir procurá-lo. */}
        <section
          aria-label="Resultado"
          aria-live="polite"
          className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-5 sm:p-6 shadow-sm lg:sticky lg:top-24"
        >
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-4">
            Resultado
          </h2>
          {resultado ?? <Espera />}
        </section>
      </div>
    </div>
  );
}
