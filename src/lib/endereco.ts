import { abaDoMesAtual, abaValida } from "./constants";
import { GRUPO_PADRAO, grupoParaEndereco, type IdGrupo } from "./grupos";

/**
 * O estado da tela escrito no endereço, e lido de volta.
 *
 * Tudo aqui é texto e validação, sem React: a tela decide o que guardar, e
 * estas funções garantem que um endereço editado à mão, velho ou quebrado
 * nunca vire filtro inválido — o que não se reconhece é ignorado, e a tela
 * abre no padrão.
 */

/** Os parâmetros do endereço como um objeto simples. */
export function lerConsulta(busca: string): Record<string, string> {
  const lidos: Record<string, string> = {};
  new URLSearchParams(busca).forEach((valor, chave) => {
    lidos[chave] = valor;
  });
  return lidos;
}

/**
 * Monta a parte "?a=b" do endereço, só com o que foge do padrão.
 *
 * Valor vazio é padrão e fica de fora: o endereço de quem não filtrou nada
 * continua limpo, e um link compartilhado carrega só o recorte que importa.
 */
export function escreverConsulta(valores: Record<string, string>): string {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(valores)) {
    if (valor) params.set(chave, valor);
  }
  const texto = params.toString();
  return texto ? `?${texto}` : "";
}

/** "Futebol,NFL" → ["Futebol", "NFL"]; vazio → []. */
export function lerLista(valor: string | undefined): string[] {
  if (!valor) return [];
  return valor
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** O valor, se estiver entre os permitidos; senão `undefined`. */
export function escolher<T extends string>(
  valor: string | undefined,
  permitidos: readonly T[]
): T | undefined {
  return permitidos.find((p) => p === valor);
}

/** Data no formato dos campos de data ("2026-09-15"), ou "". */
export function lerData(valor: string | undefined): string {
  if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return "";
  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  // "2026-02-31" passa na forma e não existe: o Date o empurra para março.
  return data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia ? valor : "";
}

/** A aba, se for válida e diferente da do mês — que é o padrão e não vai ao endereço. */
export function abaParaEndereco(aba: string, ref: Date = new Date()): string {
  return aba === abaDoMesAtual(ref) ? "" : aba;
}

/** A aba lida do endereço, se for uma que a API aceita. */
export function abaDoEndereco(valor: string | undefined): string | undefined {
  return valor && abaValida(valor) ? valor : undefined;
}

/**
 * Um link interno que leva junto a aba e o grupo escolhidos.
 *
 * Sem isso, quem estava olhando Abril26 no Painel e clicava em "Ver todas"
 * caía no feed do mês atual e tinha de escolher Abril26 de novo. O grupo vai
 * pelo mesmo motivo (#72): do Painel do Sigma, "Ver todas" abre as apostas do
 * Sigma, e não as do gratuito.
 */
export function comAba(
  caminho: string,
  aba: string,
  grupo: IdGrupo = GRUPO_PADRAO,
  ref: Date = new Date()
): string {
  return `${caminho}${escreverConsulta({
    aba: abaParaEndereco(aba, ref),
    grupo: grupoParaEndereco(grupo),
  })}`;
}
