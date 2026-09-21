import type { Page } from "@playwright/test";

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
 * Todo texto visível da tela abaixo do contraste mínimo da WCAG (4,5:1, ou
 * 3:1 para texto grande), medido contra o fundo que está de fato atrás dele —
 * compondo os fundos semitransparentes dos ancestrais até achar um opaco.
 *
 * Fica de fora o que não é para ser lido: `aria-hidden` (numerais de enfeite)
 * e `.sr-only`. Os números animados moram no shadow DOM do NumberFlow; deles
 * se mede a cor do elemento que os hospeda.
 */
export async function textosSemContraste(page: Page) {
  return page.evaluate(() => {
    type Cor = { r: number; g: number; b: number; a: number };
    const ler = (c: string): Cor | null => {
      const rgb = c.match(/rgba?\(([^)]+)\)/);
      if (rgb) {
        const p = rgb[1]
          .split(/[ ,/]+/)
          .filter(Boolean)
          .map(Number);
        return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
      }
      // O que color-mix() devolve no estilo computado.
      const srgb = c.match(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/);
      if (srgb)
        return {
          r: Number(srgb[1]) * 255,
          g: Number(srgb[2]) * 255,
          b: Number(srgb[3]) * 255,
          a: srgb[4] === undefined ? 1 : Number(srgb[4]),
        };
      return null;
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
    const corpo = ler(getComputedStyle(document.body).backgroundColor) as Cor;
    const fundoDe = (el: Element): Cor | null => {
      const camadas: Cor[] = [];
      for (
        let e: Element | null = el;
        e && e !== document.documentElement;
        e = e.parentElement
      ) {
        const cs = getComputedStyle(e);
        // Fundo de imagem não dá para medir; gradiente, o do esqueleto, sim.
        if (cs.backgroundImage !== "none" && !cs.backgroundImage.includes("gradient"))
          return null;
        const c = ler(cs.backgroundColor);
        if (c && c.a > 0) {
          camadas.push(c);
          if (c.a >= 1) break;
        }
      }
      return camadas.reduceRight((fundo, camada) => sobre(camada, fundo), corpo);
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
    const medir = (el: Element, alvo: string) => {
      const cs = getComputedStyle(el);
      const cor = ler(cs.color);
      const fundo = fundoDe(el);
      if (!cor || !fundo) return null;
      const c = contraste(cor.a < 1 ? sobre(cor, fundo) : cor, fundo);
      const tamanho = Number.parseFloat(cs.fontSize);
      const grande = tamanho >= 24 || (tamanho >= 18.66 && Number(cs.fontWeight) >= 700);
      const minimo = grande ? 3 : 4.5;
      return c < minimo ? `${c.toFixed(2)} < ${minimo}: ${alvo}` : null;
    };

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
    return [...falhas];
  });
}
