import { expect, type Page, test } from "@playwright/test";

/**
 * O que a tela diz para quem não a enxerga, e o tamanho do que se toca.
 *
 * Três defeitos que nenhum teste visual pegaria: o leitor de tela lia os
 * números animados algarismo por algarismo, o título da home dependia de um
 * rótulo que o VoiceOver ignora, e botões de filtro tinham 23 px de altura.
 */

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

async function alvosPequenos(page: Page) {
  return page.evaluate(() => {
    const pequenos: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>(
      "a[href], button, input, select, [role=button]"
    )) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || getComputedStyle(el).visibility === "hidden") continue;
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
    return pequenos;
  });
}

for (const rota of ["/painel", "/apostas", "/historico", "/estatisticas", "/adms"]) {
  test(`nenhum alvo de toque abaixo de 24 px em ${rota}`, async ({ page }) => {
    await page.goto(rota);
    await expect(page.locator(".animate-shimmer")).toHaveCount(0, { timeout: 15_000 });
    expect(await alvosPequenos(page)).toEqual([]);
  });
}
