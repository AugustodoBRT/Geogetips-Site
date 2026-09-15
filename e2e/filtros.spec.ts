import { expect, test } from "@playwright/test";

/**
 * O intervalo de datas do Painel.
 *
 * Ele substituiu o antigo seletor de dia, e o que precisa ser protegido é a
 * regra que veio junto: **a janela do gráfico some enquanto há intervalo**.
 * São dois controles do mesmo eixo, e deixar os dois na tela ao mesmo tempo
 * permite escolher combinação que se contradiz.
 *
 * A primeira tentativa escondeu a janela com o atributo `hidden` — e não
 * funcionou: `hidden` vale `display: none`, mas a classe `flex` do Tailwind
 * ganha dele na cascata, e os botões continuaram visíveis. É o tipo de defeito
 * que não aparece em tsc nem em lint, e que só um teste de tela pega.
 */

const JANELAS = ["7D", "30D", "90D", "120D", "Tudo"];

function botoesDeJanela(page: import("@playwright/test").Page) {
  return page.getByRole("button", {
    name: new RegExp(`^(${JANELAS.join("|")})$`),
  });
}

test("o intervalo recorta a tela e esconde a janela do gráfico", async ({ page }) => {
  await page.goto("/painel");

  const kpis = page.getByRole("region", { name: "Indicadores do período" });
  await expect(kpis).toBeVisible({ timeout: 15_000 });

  // Sem intervalo: a janela está na tela e o KPI fala do acumulado.
  await expect(botoesDeJanela(page).first()).toBeVisible();
  await expect(page.getByText("Lucro Acumulado")).toBeVisible();

  // O intervalo sai dos próprios limites da aba carregada, para o teste não
  // depender de que datas a planilha de demonstração tem hoje.
  const de = page.locator("#periodo-de");
  const ate = page.locator("#periodo-ate");
  const primeiroDia = await de.getAttribute("min");
  const ultimoDia = await ate.getAttribute("max");
  test.skip(!primeiroDia || !ultimoDia, "a aba não trouxe datas");

  await de.fill(primeiroDia as string);
  await ate.fill(ultimoDia as string);

  // Com intervalo: a janela sai do DOM e a tela inteira passa a falar do período.
  await expect(botoesDeJanela(page)).toHaveCount(0);
  await expect(page.getByText("Lucro no Período")).toBeVisible();
  await expect(kpis).toBeVisible();

  // Os dois blocos de recorte acompanham. Eles são o motivo de o intervalo ter
  // substituído o seletor de dia: com um dia só, ficavam de fora e precisavam
  // de uma nota explicando que não seguiam o resto da tela.
  const casas = page.getByRole("region", { name: "Resultado por Casa" });
  await expect(casas).toBeVisible();
  await expect(casas.getByText(/As mais usadas \d{2}\/\d{2}\/\d{4}/)).toBeVisible();
  await expect(page.getByText(/^Distribuição \d{2}\/\d{2}\/\d{4}/)).toBeVisible();

  // Limpar devolve os dois.
  await page.getByRole("button", { name: "Limpar intervalo de datas" }).click();
  await expect(botoesDeJanela(page).first()).toBeVisible();
  await expect(page.getByText("Lucro Acumulado")).toBeVisible();
});

test("um dia só é o intervalo com as duas pontas iguais", async ({ page }) => {
  await page.goto("/painel");
  await expect(
    page.getByRole("region", { name: "Indicadores do período" })
  ).toBeVisible({ timeout: 15_000 });

  const ate = page.locator("#periodo-ate");
  const ultimoDia = await ate.getAttribute("max");
  test.skip(!ultimoDia, "a aba não trouxe datas");

  // É o que o seletor de dia fazia, e continua possível.
  await page.locator("#periodo-de").fill(ultimoDia as string);
  await ate.fill(ultimoDia as string);

  await expect(page.getByText(/^dia \d{2}\/\d{2}\/\d{4}$/).first()).toBeVisible();
});
