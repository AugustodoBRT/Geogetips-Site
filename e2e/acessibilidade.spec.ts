import { expect, type Page, test } from "@playwright/test";

/**
 * O que a tela diz para quem não a enxerga, e o tamanho do que se toca.
 *
 * Três defeitos que nenhum teste visual pegaria: o leitor de tela lia os
 * números animados algarismo por algarismo, o título da home dependia de um
 * rótulo que o VoiceOver ignora, e botões de filtro tinham 23 px de altura.
 */

/**
 * Marcas de língua: palavras que praticamente só aparecem num idioma.
 *
 * Em português vão acentuadas de propósito — "não" e "você" não acontecem por
 * acaso num texto em inglês. Em inglês, "the" é o artigo mais comum da língua
 * e quase não aparece em português fora de nome de marca.
 */
const MARCAS_DE_LINGUA: Record<string, RegExp> = {
  pt: /\b(não|você|são|histórico)\b/,
  en: /\b(the|your|month|bets)\b/,
};

test("o idioma declarado é o idioma do texto", async ({ page }) => {
  await page.goto("/");
  const lang = await page.locator("html").getAttribute("lang");
  const texto = (await page.locator("main").innerText()).toLowerCase();

  // Nada na suíte prendia o `lang` antes desta guarda, e era o pior buraco
  // possível para a virada de idioma (#128): a bateria inteira ficaria verde
  // com a página em inglês se anunciando como portuguesa. Ninguém veria —
  // mas o leitor de tela leria inglês com fonética portuguesa, e o buscador
  // indexaria a página na língua errada.
  //
  // A guarda não afirma QUAL é o idioma, e é de propósito: afirmar "pt-BR"
  // aqui ficaria verde justamente no caso que importa. Ela afirma que os dois
  // concordam, então continua valendo depois da virada, pelo outro ramo.
  const base = (lang ?? "").split("-")[0];
  const marca = MARCAS_DE_LINGUA[base];
  expect(
    marca,
    `o <html> declara "${lang}", e esta guarda não sabe conferir esse idioma — acrescente a marca dele em MARCAS_DE_LINGUA`
  ).toBeDefined();
  expect(texto).toMatch(marca);

  // E o texto não pode casar com a marca da OUTRA língua: sem isto, uma página
  // meio traduzida passaria pelos dois lados.
  for (const [outra, marca] of Object.entries(MARCAS_DE_LINGUA)) {
    if (outra !== base) expect(texto).not.toMatch(marca);
  }
});

test("os números animados se leem como número, e não dígito a dígito", async ({
  page,
}) => {
  await page.goto("/painel");
  const kpis = page.getByRole("region", { name: "Indicadores do período" });
  await expect(kpis).toBeVisible({ timeout: 15_000 });
  await expect(kpis.getByText(/R\$/).first()).toBeAttached();

  const lido = await kpis.ariaSnapshot();
  // Antes: "+ R$ 1 2 . 2 1 2 , 9 5". Agora o valor vem inteiro: o lucro com
  // centavos, e as porcentagens com a vírgula colada nos algarismos.
  expect(lido).toMatch(/R\$\s?[\d.]+,\d{2}/);
  expect(lido).toMatch(/\d+,\d+%/);
  // O que não pode aparecer é algarismo separado de algarismo por espaço dentro
  // do mesmo número (três em sequência), nem ponto e vírgula soltos entre eles.
  // Dois números vizinhos, como o total e o "5 Green" logo abaixo, são legítimos.
  expect(lido).not.toMatch(/\d \d \d/);
  expect(lido).not.toMatch(/\d [.,] \d/);
});

test("o título da home se lê inteiro, sem depender de aria-label em span", async ({
  page,
}) => {
  await page.goto("/");
  const titulo = page.getByRole("heading", { level: 1 });
  await expect(titulo).toHaveAccessibleName(
    /^Suas apostas merecem matemática de verdade\.?$/
  );
  // O rótulo em elemento genérico é o que o VoiceOver ignorava.
  await expect(titulo.locator("span[aria-label]")).toHaveCount(0);
});

/** O conjunto de alvos de toque. Contado por dois caminhos independentes (#136). */
const SELETOR_DE_ALVOS = "a[href], button, input, select, [role=button]";

/** O alvo que a varredura planta em si mesma para provar que ainda reprova. */
const PROVA_DE_ALVO = "__prova-de-alvo__";

/**
 * Os alvos de toque menores que 24 px, e a prova de que a varredura os viu.
 *
 * ## Por que não basta devolver a lista (#136)
 *
 * Lista vazia não distinguia "nenhum alvo é pequeno" de "não achei alvo nenhum
 * para medir". O caso concreto: `/adms` rende `null` no estado de erro, e a
 * varredura passaria numa tela sem a grade de cartões.
 *
 * Um piso do tipo `medidos > 0` **não** resolveria isso, e foi medido: o erro
 * apaga só a grade; cabeçalho, menu, botão de tema e rodapé continuam na
 * página, e o piso seria pago pela moldura com uma ordem de grandeza de folga.
 *
 * Por isso aqui vão duas provas que não dependem de escolher número nenhum:
 *
 * **Contagem independente.** O mesmo conjunto é contado por fora, pelo
 * Playwright, e por dentro, no `evaluate`. Nenhum número é escolhido por
 * ninguém: ele é lido duas vezes, por caminhos diferentes. Discordarem
 * significa que o coletor parou de alcançar a página.
 *
 * **Controle positivo.** A varredura planta um botão de 10 px, mede pelo mesmo
 * caminho dos outros, e confere que ele saiu na lista. Sem isso, afrouxar o
 * limiar de 24 px deixaria os cinco testes verdes com a lista vazia.
 *
 * É o mesmo par de `unidade-e-cor.spec.ts`, onde um token que não existe prova
 * que a leitura da paleta ainda responde.
 */
async function alvosPequenos(page: Page) {
  // Esta contagem não passa pelo `evaluate` cujo alcance está em dúvida, e é
  // tirada ANTES de plantar a prova.
  const porFora = await page.locator(SELETOR_DE_ALVOS).count();

  const dentro = await page.evaluate(
    ({ seletor, prova }) => {
      const plantado = document.createElement("button");
      plantado.type = "button";
      plantado.textContent = prova;
      plantado.style.cssText =
        "position:fixed;left:0;top:0;width:10px;height:10px;padding:0;overflow:hidden";
      document.body.appendChild(plantado);

      const pequenos: string[] = [];
      let candidatos = 0;
      for (const el of document.querySelectorAll<HTMLElement>(seletor)) {
        candidatos += 1;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height || getComputedStyle(el).visibility === "hidden")
          continue;
        // Exceções da própria norma (WCAG 2.2, 2.5.8): o atalho "pular para o
        // conteúdo", que só aparece com o foco, e link no meio de uma frase.
        if (el.getAttribute("href") === "#conteudo") continue;
        const pai = el.parentElement;
        const noMeioDaFrase =
          el.tagName === "A" &&
          pai !== null &&
          (pai.textContent ?? "").trim().length >
            (el.textContent ?? "").trim().length + 10 &&
          getComputedStyle(pai).display !== "flex";
        if (noMeioDaFrase) continue;
        if (r.width < 24 || r.height < 24) {
          pequenos.push(
            `${el.tagName} "${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`
          );
        }
      }

      plantado.remove();
      const provaReprovou = pequenos.some((p) => p.includes(prova));
      return {
        pequenos: pequenos.filter((p) => !p.includes(prova)),
        // A prova é do teste, não da tela: sai da contagem para as duas
        // fontes falarem do mesmo conjunto.
        candidatos: candidatos - 1,
        provaReprovou,
      };
    },
    { seletor: SELETOR_DE_ALVOS, prova: PROVA_DE_ALVO }
  );

  return { ...dentro, porFora };
}

for (const rota of ["/painel", "/apostas", "/historico", "/estatisticas", "/adms"]) {
  test(`nenhum alvo de toque abaixo de 24 px em ${rota}`, async ({ page }) => {
    await page.goto(rota);
    await expect(page.locator(".animate-shimmer")).toHaveCount(0, { timeout: 15_000 });

    const v = await alvosPequenos(page);
    expect(
      v.provaReprovou,
      `${rota}: a prova de 10 px não reprovou — a varredura parou de medir alvo`
    ).toBe(true);
    expect(
      v.candidatos,
      `${rota}: o Playwright achou ${v.porFora} alvos e a varredura achou ${v.candidatos} — ela parou de alcançar a página`
    ).toBe(v.porFora);
    expect(v.pequenos).toEqual([]);
  });
}
