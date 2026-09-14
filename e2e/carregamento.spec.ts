import { expect, test } from "@playwright/test";

/**
 * Os dois tipos de espera.
 *
 * Com a planilha respondendo rápido, a diferença entre eles é invisível — e por
 * isso passou despercebida por semanas. Aqui a resposta da API é atrasada de
 * propósito, para que os dois estados durem tempo suficiente para serem
 * verificados:
 *
 * - **primeira carga e troca de aba** → esqueleto, porque não há o que mostrar,
 *   ou porque o que está na tela é de outro mês;
 * - **atualizar a mesma aba** → o conteúdo **fica** e só a barra de progresso
 *   avisa. Apagar a tela para redesenhar quase o mesmo número é perda pura para
 *   quem está lendo.
 */

/** Segura a resposta da API por um tempo, para o estado de espera ser visível. */
async function atrasarApi(page: import("@playwright/test").Page, ms: number) {
  await page.route("**/api/bets*", async (rota) => {
    await new Promise((r) => setTimeout(r, ms));
    await rota.continue();
  });
}

test("a primeira carga mostra esqueleto e depois o conteúdo", async ({ page }) => {
  await atrasarApi(page, 2000);
  await page.goto("/painel");

  // O esqueleto está no HTML pré-renderizado: aparece antes de qualquer
  // JavaScript rodar. É por isso que não há `loading.tsx` de rota.
  await expect(page.locator(".animate-shimmer").first()).toBeVisible();

  const kpis = page.getByRole("region", { name: "Indicadores do período" });
  await expect(kpis).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".animate-shimmer")).toHaveCount(0);
});

test("atualizar não apaga a tela, só mostra progresso", async ({ page }) => {
  await page.goto("/painel");

  const kpis = page.getByRole("region", { name: "Indicadores do período" });
  await expect(kpis).toBeVisible({ timeout: 15_000 });

  // O atraso entra só agora: a primeira carga foi rápida, a releitura é lenta.
  await atrasarApi(page, 2000);
  await page.getByRole("button", { name: "Recarregar dados" }).click();

  // Durante a releitura: barra de progresso à vista e **os números no lugar**.
  await expect(page.getByRole("progressbar")).toBeVisible();
  await expect(kpis).toBeVisible();
  await expect(page.locator(".animate-shimmer")).toHaveCount(0);

  await expect(page.getByRole("progressbar")).toBeHidden({ timeout: 15_000 });
  await expect(kpis).toBeVisible();
});

test("trocar de aba troca o conteúdo pelo esqueleto", async ({ page }) => {
  await page.goto("/painel");

  const kpis = page.getByRole("region", { name: "Indicadores do período" });
  await expect(kpis).toBeVisible({ timeout: 15_000 });

  await atrasarApi(page, 2000);

  // Aqui o esqueleto é obrigatório: o cabeçalho já mudou de mês, e segurar os
  // números do mês anterior embaixo do rótulo novo seria mostrar dado errado
  // num site cuja promessa inteira é bater com a planilha.
  const seletor = page.locator("#seletor-painel");
  // Escolhe uma aba **diferente** da que já está selecionada: selecionar a
  // mesma não dispara leitura nenhuma, e o teste passaria sem testar nada.
  const atual = await seletor.inputValue();
  const valores = await seletor
    .locator("option")
    .evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
  const outra = valores.find((v) => v !== atual);
  test.skip(!outra, "a planilha de demonstração só tem uma aba");

  await seletor.selectOption(outra as string);
  await expect(page.locator(".animate-shimmer").first()).toBeVisible();
  await expect(kpis).toBeHidden();

  await expect(kpis).toBeVisible({ timeout: 15_000 });
});
