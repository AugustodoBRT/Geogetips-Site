import { expect, test } from "@playwright/test";

/**
 * As seis telas abrem e mostram conteúdo.
 *
 * Teste de fumaça, de propósito: o que ele protege é que a página não fique
 * presa no esqueleto, não quebre no console e responda 200. Regra de cálculo é
 * assunto dos testes de unidade — repetir aqui custaria minutos de CI para
 * verificar o que já está verificado em milissegundos.
 */

const TELAS = [
  { caminho: "/", nome: "Home", marca: "Suas apostas merecem" },
  { caminho: "/painel", nome: "Painel", marca: "Painel de Performance" },
  { caminho: "/apostas", nome: "Apostas", marca: "Feed de Apostas" },
  { caminho: "/historico", nome: "Histórico", marca: "Histórico Mês a Mês" },
  { caminho: "/adms", nome: "Adms", marca: "Performance dos Adms" },
  { caminho: "/estatisticas", nome: "Estatísticas", marca: "Estatísticas" },
];

for (const tela of TELAS) {
  test(`${tela.nome} abre, responde 200 e não fica no esqueleto`, async ({ page }) => {
    const erros: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") erros.push(m.text());
    });
    page.on("pageerror", (e) => erros.push(e.message));

    const resposta = await page.goto(tela.caminho);
    expect(resposta?.status()).toBe(200);

    await expect(page.getByText(tela.marca).first()).toBeVisible();

    // O esqueleto tem de sair. Ele ficar para sempre foi defeito de verdade:
    // com `loading.tsx`, o Next marcava a fronteira de Suspense como adiada e
    // o conteúdo nunca substituía o marcador de posição.
    await expect(page.locator(".animate-shimmer")).toHaveCount(0, {
      timeout: 15_000,
    });

    expect(erros, `erros no console em ${tela.caminho}`).toEqual([]);
  });
}

test("a navegação leva de uma tela à outra", async ({ page }) => {
  await page.goto("/painel");
  await page.getByRole("link", { name: "Apostas", exact: true }).first().click();
  await expect(page).toHaveURL(/\/apostas$/);
  await expect(page.getByRole("heading", { name: "Feed de Apostas" })).toBeVisible();
});
