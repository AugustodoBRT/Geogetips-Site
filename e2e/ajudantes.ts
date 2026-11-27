import { expect, type Page } from "@playwright/test";

/**
 * Desliga a rolagem suave do site durante o teste.
 *
 * Com `scroll-behavior: smooth`, a página ainda desliza quando o Playwright leva
 * o mouse ao ponto que calculou — e o mouse cai em outro lugar. Aconteceu uma
 * vez em 31 execuções, com a suíte inteira rodando em paralelo: o cartão foi
 * parar embaixo do menu fixo e o hover não o alcançou. O que se mede aqui é o
 * hover, não a rolagem.
 */
export async function semRolagemSuave(page: Page) {
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
  });
}

/**
 * O texto que a varredura planta em si mesma para provar que ainda reprova.
 *
 * Um elemento com contraste conhecidamente ruim, medido pelo MESMO caminho dos
 * outros. Se ele não sai na lista de falhas, o medidor parou de medir — e aí
 * lista vazia não quer dizer nada. É o irmão do `--token-que-nao-existe` de
 * `unidade-e-cor.spec.ts`: controle positivo, não contagem.
 */
const PROVA = "__prova-do-medidor__";

/**
 * O que a varredura de contraste devolve, e por que não é só a lista de falhas.
 *
 * Sem `export` de propósito: o `knip.json` declara `entry: ["e2e/**\/*.spec.ts"]`,
 * então este arquivo é dependência, e todo export que nenhum spec importa vira
 * achado de `npm run morto`. Os dois ajudantes que recebem um `Varredura` são
 * exportados; o tipo em si ninguém precisa nomear de fora.
 */
interface Varredura {
  /** Os infratores de verdade, sem a prova plantada. */
  falhas: string[];
  /** Quantos elementos foram medidos até o fim, com número na mão. */
  medidos: number;
  /**
   * Elementos que a varredura NÃO soube medir, com o motivo.
   *
   * Teto zero, de propósito: aqui só entra cegueira (fundo que não dá para
   * ler), nunca política. O que se deixa de medir por decisão escrita —
   * `aria-hidden`, `.sr-only`, invisível — não é pulo e não entra nesta conta.
   */
  cegos: string[];
  /** A prova plantada apareceu entre as falhas. Falso = o medidor não mede. */
  provaReprovou: boolean;
}

/**
 * Todo texto visível da tela abaixo do contraste mínimo da WCAG (4,5:1, ou
 * 3:1 para texto grande), medido contra o fundo que está de fato atrás dele —
 * compondo os fundos semitransparentes dos ancestrais até achar um opaco.
 *
 * Fica de fora o que não é para ser lido: `aria-hidden` (numerais de enfeite)
 * e `.sr-only`. Os números animados moram no shadow DOM do NumberFlow; deles
 * se mede a cor do elemento que os hospeda.
 *
 * ## A cor é convertida pelo navegador, não à mão (#136)
 *
 * Antes havia um `ler()` com dois regex, para `rgb()` e `color(srgb ...)`.
 * Qualquer outra sintaxe devolvia `null`, e aí o elemento saía da conta sem
 * rastro — ou, quando era o FUNDO, a camada era descartada e o laço continuava
 * subindo mesmo tendo passado por um fundo opaco, produzindo um número errado
 * em vez de uma desistência.
 *
 * Agora a cor vai para um canvas de 1×1 e volta em RGBA. Medido no mesmo
 * Chromium da suíte: `oklch()`, `lab()`, `lch()`, `color(display-p3 ...)` e
 * alfa em sintaxe moderna passam a ser lidos, e as dez sintaxes que o `ler()`
 * já resolvia saem idênticas, dígito a dígito.
 *
 * E some a categoria inteira: `getComputedStyle` de uma cor inválida devolve
 * `rgb(0, 0, 0)`, então no estilo computado nunca existe cor que o navegador
 * não saiba ler. O que havia era o ajudante não saber.
 */
export async function textosSemContraste(page: Page): Promise<Varredura> {
  return page.evaluate((prova) => {
    type Cor = { r: number; g: number; b: number; a: number };

    // O canvas faz a conversão que o navegador já sabe fazer. `willReadFrequently`
    // porque são centenas de leituras de um pixel por varredura.
    const tela = document.createElement("canvas");
    const ctx = tela.getContext("2d", { willReadFrequently: true });

    const ler = (c: string): Cor | null => {
      if (!ctx) return null;
      // Sentinela: `fillStyle` ignora valor inválido e mantém o anterior. Se
      // sobrou a sentinela, o navegador não soube ler — e isso distingue cor
      // inválida de cor válida, em vez de devolver preto calado.
      ctx.fillStyle = "#010203";
      ctx.fillStyle = c;
      if (ctx.fillStyle === "#010203" && c.trim().toLowerCase() !== "#010203") {
        return null;
      }
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
    };

    const canal = (v: number) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    const luz = (c: Cor) =>
      0.2126 * canal(c.r) + 0.7152 * canal(c.g) + 0.0722 * canal(c.b);
    const contraste = (a: Cor, b: Cor) => {
      const [x, y] = [luz(a), luz(b)].sort((p, q) => q - p);
      return (x + 0.05) / (y + 0.05);
    };
    const sobre = (cima: Cor, baixo: Cor): Cor => ({
      r: cima.r * cima.a + baixo.r * (1 - cima.a),
      g: cima.g * cima.a + baixo.g * (1 - cima.a),
      b: cima.b * cima.a + baixo.b * (1 - cima.a),
      a: 1,
    });

    const cegos: string[] = [];
    const corpo = ler(getComputedStyle(document.body).backgroundColor);

    /**
     * O fundo real de um elemento, ou o motivo de não dar para saber.
     *
     * Devolve `{ cor }` quando mediu e `{ cego }` quando não — nunca `null`
     * calado. Era o `null` calado que fazia o laço seguir subindo por cima de
     * um fundo opaco e afirmar um número errado.
     */
    const fundoDe = (el: Element): { cor?: Cor; cego?: string } => {
      if (!corpo) return { cego: "o fundo do <body> não foi lido" };
      const camadas: Cor[] = [];
      for (
        let e: Element | null = el;
        e && e !== document.documentElement;
        e = e.parentElement
      ) {
        const cs = getComputedStyle(e);
        if (cs.backgroundImage !== "none") {
          // Imagem rasterizada não dá para medir. Gradiente também não: antes
          // ele era aceito e em seguida ignorado — só o backgroundColor entrava
          // na conta —, então o texto acabava medido contra o que está ATRÁS do
          // gradiente. Hoje nenhum texto cai aqui; se cair, fica vermelho
          // dizendo qual, em vez de passar com um número inventado.
          const tipo = cs.backgroundImage.includes("gradient")
            ? "fundo em gradiente"
            : "fundo em imagem";
          return { cego: `${tipo} em <${e.tagName.toLowerCase()}>` };
        }
        const c = ler(cs.backgroundColor);
        if (!c) {
          return { cego: `fundo ilegível "${cs.backgroundColor}"` };
        }
        if (c.a > 0) {
          camadas.push(c);
          if (c.a >= 1) break;
        }
      }
      return { cor: camadas.reduceRight((f, camada) => sobre(camada, f), corpo) };
    };

    const visivel = (el: Element) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return false;
      for (let e: Element | null = el; e; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (
          cs.display === "none" ||
          cs.visibility === "hidden" ||
          Number(cs.opacity) < 0.5
        )
          return false;
      }
      return true;
    };

    let medidos = 0;
    const medir = (el: Element, alvo: string) => {
      const cs = getComputedStyle(el);
      const cor = ler(cs.color);
      if (!cor) {
        cegos.push(`cor ilegível "${cs.color}": ${alvo}`);
        return null;
      }
      const fundo = fundoDe(el);
      if (!fundo.cor) {
        cegos.push(`${fundo.cego}: ${alvo}`);
        return null;
      }
      const c = contraste(cor.a < 1 ? sobre(cor, fundo.cor) : cor, fundo.cor);
      medidos += 1;
      const tamanho = Number.parseFloat(cs.fontSize);
      const grande = tamanho >= 24 || (tamanho >= 18.66 && Number(cs.fontWeight) >= 700);
      const minimo = grande ? 3 : 4.5;
      return c < minimo ? `${c.toFixed(2)} < ${minimo}: ${alvo}` : null;
    };

    // A prova entra ANTES da varredura e sai do resultado depois: ela tem de
    // passar pelo andador, pelo filtro de visibilidade e pela conta, como
    // qualquer texto da tela. Cinza sobre cinza dá perto de 1,3:1.
    const plantada = document.createElement("span");
    plantada.textContent = prova;
    plantada.style.cssText =
      "position:fixed;left:0;top:0;font-size:16px;color:#777;background:#888;z-index:-1";
    document.body.appendChild(plantada);

    const falhas = new Set<string>();
    const vistos = new Set<Element>();
    const andar = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (andar.nextNode()) {
      const no = andar.currentNode;
      const el = no.parentElement;
      if (!no.textContent?.trim() || !el || vistos.has(el)) continue;
      vistos.add(el);
      if (el.closest("script, style, noscript, .sr-only, [aria-hidden='true']")) continue;
      if (!visivel(el)) continue;
      const falha = medir(
        el,
        `<${el.tagName.toLowerCase()}> "${no.textContent.trim().slice(0, 40)}"`
      );
      if (falha) falhas.add(falha);
    }
    for (const el of document.querySelectorAll("number-flow-react")) {
      if (!visivel(el)) continue;
      const falha = medir(
        el,
        `número "${el.parentElement?.previousElementSibling?.textContent}"`
      );
      if (falha) falhas.add(falha);
    }

    plantada.remove();
    const listadas = [...falhas];
    const provaReprovou = listadas.some((f) => f.includes(prova));

    return {
      falhas: listadas.filter((f) => !f.includes(prova)),
      // A prova não conta como tela medida: ela é do teste, não do site.
      medidos: medidos - (provaReprovou ? 1 : 0),
      cegos,
      provaReprovou,
    };
  }, PROVA);
}

/**
 * Antes de acreditar numa lista vazia, conferir que o medidor mediu.
 *
 * Duas perguntas que a lista de falhas não responde sozinha:
 *
 * **O medidor ainda sabe reprovar?** A varredura planta em si mesma um texto
 * com contraste ruim e confere que ele saiu na lista. Sem isso, trocar um sinal
 * em `contraste()` ou pôr `minimo = 0` deixa as nove varreduras verdes, com a
 * lista vazia e um ar de aprovação.
 *
 * **Sobrou algo que ele não soube medir?** Teto zero: `cegos` só recebe fundo
 * que não dá para ler, e hoje a tela não produz nenhum. Descarte de política
 * não entra ali.
 *
 * É o par que `unidade-e-cor.spec.ts` já usa: um ajudante nomeado para a prova
 * do instrumento, e o `expect` da lista escrito por extenso em cada ponto de
 * chamada, onde quem lê o spec o vê.
 *
 * Vem em duas formas de propósito. `problemasDoMedidor` devolve as queixas como
 * texto, para o laço de `tema.spec.ts` acumular e relatar uma vez só — como o
 * `checar-cores.mjs` faz, em vez de abortar na primeira tela e suprimir o
 * relatório das outras seis. `conferirQueMediu` é a mesma coisa com o `expect`
 * junto, para quem chama uma vez.
 */
export function problemasDoMedidor(v: Varredura, onde: string): string[] {
  const problemas: string[] = [];
  if (!v.provaReprovou) {
    problemas.push(`${onde}: a prova plantada não reprovou — o medidor parou de medir`);
  }
  for (const cego of v.cegos) problemas.push(`${onde}: ${cego}`);
  return problemas;
}

export function conferirQueMediu(v: Varredura, onde: string) {
  expect(problemasDoMedidor(v, onde)).toEqual([]);
}
