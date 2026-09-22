import { expect, type Page, test } from "@playwright/test";
import { textosSemContraste } from "./ajudantes";

/**
 * Os dois grupos: o gratuito e o GeogeTips - Sigma (#72).
 *
 * No modo demonstração os dois existem, e o Sigma tem duas apostas de hoje e
 * de ontem que o atraso de três dias tem de esconder. O que mais importa aqui
 * é a API: um atraso que só a tela respeitasse deixaria as entradas pagas
 * legíveis no JSON.
 */

/** Meia-noite de hoje menos `dias`, como número comparável com a data da aposta. */
function limite(dias: number): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - dias);
  return d.getTime();
}

function timestamp(data: string): number {
  const [d, m, a] = data.split("/").map(Number);
  return new Date(a, m - 1, d).getTime();
}

const seletor = (page: Page) => page.getByRole("group", { name: "Grupo" });

test("a API do Sigma nunca entrega aposta dentro do atraso de três dias", async ({
  request,
}) => {
  const resposta = await request.get("/api/bets?tab=TODOS&grupo=sigma");
  expect(resposta.ok()).toBe(true);
  const json = await resposta.json();
  expect(json.grupo).toBe("sigma");
  expect(json.grupos.map((g: { id: string }) => g.id)).toEqual(["gratis", "sigma"]);
  expect(json.data.length).toBeGreaterThan(0);
  for (const aposta of json.data) {
    expect(timestamp(aposta.data)).toBeLessThanOrEqual(limite(3));
  }
  expect(JSON.stringify(json)).not.toContain("Entrada de hoje");

  const resumo = await (await request.get("/api/resumo?grupo=sigma")).json();
  expect(resumo.success).toBe(true);
  expect(resumo.grupo).toBe("sigma");
});

test("grupo que não existe responde 404, e nunca os dados de outro", async ({
  request,
}) => {
  const resposta = await request.get("/api/bets?grupo=vip");
  expect(resposta.status()).toBe(404);
  expect((await resposta.json()).grupoIndisponivel).toBe(true);
});

test("escolher o Sigma no Painel põe o grupo no endereço e avisa do atraso", async ({
  page,
}) => {
  await page.goto("/painel");
  await expect(seletor(page).getByRole("button", { name: "Grátis" })).toHaveAttribute(
    "aria-pressed",
    "true",
    { timeout: 15_000 }
  );
  await expect(page.getByText(/dias de atraso/)).toHaveCount(0);

  await seletor(page).getByRole("button", { name: "Sigma" }).click();
  await expect(page).toHaveURL(/[?&]grupo=sigma/);
  await expect(
    page.getByText("Resultados do GeogeTips - Sigma com 3 dias de atraso.")
  ).toBeVisible();
  await expect(page.getByText("Entrada de hoje")).toHaveCount(0);

  // O link para o feed leva o grupo junto.
  await page
    .getByRole("region", { name: "Últimas Apostas Registradas" })
    .getByRole("link", { name: /Ver todas/ })
    .click();
  await expect(page).toHaveURL(/\/apostas\?.*grupo=sigma/);
  await expect(seletor(page).getByRole("button", { name: "Sigma" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await page.getByLabel("Buscar apostas").fill("Entrada de");
  await expect(page.getByText("Nenhuma aposta corresponde aos filtros.")).toBeVisible();
});

test("o link do Histórico do Sigma abre o Histórico do Sigma", async ({ page }) => {
  await page.goto("/historico?grupo=sigma");
  await expect(seletor(page).getByRole("button", { name: "Sigma" })).toHaveAttribute(
    "aria-pressed",
    "true",
    { timeout: 15_000 }
  );
  await expect(page.getByText(/com 3 dias de atraso/)).toBeVisible();
});

test("a lista de espera leva à página do Sigma na prop.ag", async ({ page }) => {
  await page.goto("/painel");
  const link = page.getByRole("link", { name: "Entrar na lista de espera" });
  await expect(link).toHaveAttribute("href", "https://prop.ag/exemplo-sigma");
  await expect(link).toHaveAttribute("target", "_blank");
});

for (const tema of ["claro", "escuro"] as const) {
  test(`seletor e aviso do Sigma passam no contraste no tema ${tema}`, async ({
    browser,
  }) => {
    const contexto = await browser.newContext({ reducedMotion: "reduce" });
    const page = await contexto.newPage();
    await page.addInitScript((v) => localStorage.setItem("geogetips-tema", v), tema);
    await page.goto("/painel?grupo=sigma", { waitUntil: "networkidle" });
    await expect(page.getByText(/com 3 dias de atraso/)).toBeVisible();
    expect(await textosSemContraste(page)).toEqual([]);
    await contexto.close();
  });
}
