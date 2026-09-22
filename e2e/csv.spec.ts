import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

/**
 * Baixar o recorte do feed em CSV (#69).
 *
 * O formato está em lib/csv.test.ts. Aqui: o arquivo sai, com o nome do
 * recorte, e traz o filtro inteiro — não só o que está desenhado na tela.
 */

test("baixa o recorte do filtro, com o nome dele", async ({ page }) => {
  await page.goto("/apostas?resultado=green");
  const botao = page.getByRole("button", { name: "Baixar CSV" });
  await expect(botao).toBeEnabled({ timeout: 15_000 });

  const [download] = await Promise.all([page.waitForEvent("download"), botao.click()]);
  expect(download.suggestedFilename()).toMatch(/^geogetips-[a-z0-9]+-green\.csv$/);

  const texto = readFileSync(await download.path(), "utf8");
  // BOM: sem ele o Excel abre os acentos quebrados.
  expect(texto.charCodeAt(0)).toBe(0xfeff);
  const [cabecalho, ...linhas] = texto.slice(1).trimEnd().split("\r\n");
  expect(cabecalho.startsWith("Data;Esporte;Adm;Partida;Tip;Casa;Odd")).toBe(true);
  for (const linha of linhas) expect(linha).toContain(";GREEN;");

  // O mesmo número que o resumo do filtro mostra.
  const greens = await page
    .getByText("Green / Red", { exact: true })
    .locator("..")
    .locator("span")
    .first()
    .textContent();
  expect(linhas).toHaveLength(Number(greens?.replace(/\D/g, "")));
});

test("sem aposta no filtro, não há o que baixar", async ({ page }) => {
  await page.goto("/apostas?q=zzzz-nada-aqui");
  await expect(page.getByText("Nenhuma aposta corresponde aos filtros.")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("button", { name: "Baixar CSV" })).toBeDisabled();
});
