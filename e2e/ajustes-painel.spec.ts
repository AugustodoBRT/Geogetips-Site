import { expect, test } from "@playwright/test";

/**
 * Os ajustes de #80 no Painel e no menu.
 *
 * O seletor mostra só o mês, o bloco de risco virou "Atenção", com a maior
 * alta no lugar dos reds seguidos, cada dia do calendário diz o valor em reais
 * e em unidades, e o calendário veio para antes de Top Casas. A FAQ no menu do
 * computador está em perguntas.spec.ts; aqui fica a do celular.
 */

test("o seletor mostra só o mês, sem o prefixo de aba", async ({ page }) => {
  await page.goto("/painel");
  const seletor = page.locator("#seletor-painel");
  await expect(seletor.locator("option").nth(1)).toHaveText(/^\S+\d{2}$/, {
    timeout: 15_000,
  });
  const rotulos = await seletor
    .locator("option")
    .evaluateAll((os) => os.map((o) => o.textContent ?? ""));
  expect(rotulos.filter((r) => /aba/i.test(r))).toEqual([]);
  // Nem os textos em volta falam de aba: quem visita escolhe um mês.
  await expect(page.getByRole("main")).not.toContainText(/\baba\b/i);
});

test("o bloco Atenção tem a maior alta ao lado da maior queda e não tem mais reds seguidos", async ({
  page,
}) => {
  await page.goto("/painel");
  const bloco = page.getByRole("region", { name: "Atenção" });
  await expect(bloco.getByText("Maior queda")).toBeVisible({ timeout: 15_000 });
  await expect(bloco).toContainText(
    /Como a banca se comportou durante \S+: o tamanho das fases boas e ruins; não só aonde o grupo chegou\./
  );
  await expect(bloco.getByText("Reds seguidos")).toHaveCount(0);
  await expect(bloco.locator("dt")).toHaveCount(8);

  // A fase boa ao lado da ruim, na mesma linha.
  const alta = bloco
    .locator("div")
    .filter({ has: page.locator("dt", { hasText: "Maior alta" }) });
  await expect(alta.locator("dd span").first()).toHaveText(
    /^(\+R\$\s[\d.]+,\d{2}|Nenhuma)$/
  );
  const [yQueda, yAlta] = await Promise.all(
    ["Maior queda", "Maior alta"].map((r) =>
      bloco
        .locator("dt", { hasText: r })
        .evaluate((e) => Math.round(e.getBoundingClientRect().top))
    )
  );
  expect(yAlta).toBe(yQueda);

  // A grade de quatro colunas termina sem buraco.
  const caixas = await bloco
    .locator("dl > div")
    .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().right));
  const direita = Math.max(...caixas);
  expect(caixas[caixas.length - 1]).toBeCloseTo(direita, 0);
});

test("cada dia do calendário mostra reais e unidades", async ({ page }) => {
  await page.goto("/painel");
  const dia = page
    .getByRole("region", { name: "Lucro por dia" })
    .getByRole("link")
    .first();
  await expect(dia).toBeVisible({ timeout: 15_000 });

  const texto = (await dia.innerText()).replace(/\s+/g, " ");
  const m = texto.match(/([+-]?)R\$ ([\d.]+,\d{2}) \((\d+,\d{2})u\)/);
  expect(m, `"${texto}"`).not.toBeNull();
  const reais = Number((m?.[2] ?? "").replace(/\./g, "").replace(",", "."));
  const unidades = Number((m?.[3] ?? "").replace(",", "."));
  // Unidade padrão do grupo: 1u = R$ 100.
  expect(unidades).toBeCloseTo(reais / 100, 2);
  // Depois do "R$" vem espaço não separável, como o Intl escreve.
  await expect(dia).toHaveAttribute("aria-label", /R\$\s[\d.]+,\d{2} \(\d+,\d{2}u\) em /);
});

test("no celular o dia fica resumido, porque o valor inteiro não cabe", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/painel");
  const dia = page
    .getByRole("region", { name: "Lucro por dia" })
    .getByRole("link")
    .first();
  await expect(dia).toBeVisible({ timeout: 15_000 });
  expect(await dia.innerText()).not.toContain("R$");
  const largura = await dia.evaluate((e) => e.scrollWidth - e.clientWidth);
  expect(largura).toBeLessThanOrEqual(0);
});

test("Lucro por dia vem antes de Top Casas", async ({ page }) => {
  await page.goto("/painel");
  const calendario = page.getByRole("region", { name: "Lucro por dia" });
  const casas = page.getByRole("region", { name: "Top Casas" });
  await expect(calendario.getByRole("link").first()).toBeVisible({ timeout: 15_000 });
  const [yCalendario, yCasas] = await Promise.all([
    calendario.evaluate((e) => e.getBoundingClientRect().top),
    casas.evaluate((e) => e.getBoundingClientRect().top),
  ]);
  expect(yCalendario).toBeLessThan(yCasas);
});

test("no celular, o menu tem a FAQ depois de Estatísticas", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  const itens = await page
    .getByRole("navigation", { name: "Menu" })
    .getByRole("link")
    .allTextContents();
  expect(itens.map((t) => t.trim()).slice(-2)).toEqual(["Estatísticas", "FAQ"]);
});
