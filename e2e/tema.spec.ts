import { expect, type Page, test } from "@playwright/test";
import { textosSemContraste } from "./ajudantes";

/**
 * Tema claro e escuro (#62).
 *
 * A troca em si é simples; o que quebra é o resto. Um tema escuro com um
 * `bg-white` esquecido, um texto que só passava de 4,5:1 sobre o branco, ou a
 * página abrindo branca e escurecendo um instante depois. A auditoria de
 * contraste no fim percorre as sete telas nos dois temas, e é ela que segura o
 * "adaptar onde for necessário" daqui para a frente.
 */

const CHAVE = "geogetips-tema";

const tema = (page: Page) => page.evaluate(() => document.documentElement.dataset.tema);

async function guardarEscolha(page: Page, valor: "claro" | "escuro") {
  await page.addInitScript(([chave, v]) => localStorage.setItem(chave, v), [
    CHAVE,
    valor,
  ] as const);
}

test("o botão troca o tema, e a escolha vale depois de recarregar e de navegar", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/painel");
  const botao = page.getByRole("button", { name: "Tema escuro" });
  await expect(botao).toHaveAttribute("aria-pressed", "false");
  expect(await tema(page)).toBe("claro");

  await botao.click();
  expect(await tema(page)).toBe("escuro");
  await expect(botao).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate((c) => localStorage.getItem(c), CHAVE)).toBe("escuro");

  await page.reload();
  expect(await tema(page)).toBe("escuro");

  await page.getByRole("link", { name: "Apostas", exact: true }).first().click();
  await expect(page).toHaveURL(/\/apostas/);
  expect(await tema(page)).toBe("escuro");

  await page.getByRole("button", { name: "Tema escuro" }).click();
  expect(await tema(page)).toBe("claro");
});

test("sem escolha, segue o aparelho — inclusive quando ele troca com a página aberta", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  expect(await tema(page)).toBe("escuro");

  await page.emulateMedia({ colorScheme: "light" });
  await expect.poll(() => tema(page)).toBe("claro");
});

test("a escolha guardada vale mais que o aparelho", async ({ page }) => {
  await guardarEscolha(page, "claro");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  expect(await tema(page)).toBe("claro");

  // E o aparelho trocar não passa por cima dela.
  await page.emulateMedia({ colorScheme: "light" });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.waitForTimeout(200);
  expect(await tema(page)).toBe("claro");
});

test("abrir já no escuro não pisca branco", async ({ page }) => {
  // O tema tem de estar no <html> antes da primeira pintura, e não depois que
  // o React hidratar. O instante em que o <body> começa a ser lido é antes
  // de qualquer pintura e de qualquer script da página — só o do <head> rodou.
  await guardarEscolha(page, "escuro");
  await page.addInitScript(() => {
    const w = window as unknown as { __temaNoBody?: string };
    new MutationObserver((_, observador) => {
      if (!document.body) return;
      w.__temaNoBody = document.documentElement.dataset.tema;
      observador.disconnect();
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto("/painel");

  expect(
    await page.evaluate(
      () => (window as unknown as { __temaNoBody?: string }).__temaNoBody
    )
  ).toBe("escuro");
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
    "rgb(14, 12, 20)"
  );
});

test("com 'reduzir movimento', a home hidrata sem erro e não perde o tema", async ({
  browser,
}) => {
  // Com a preferência ligada, a home desenhava no navegador outra versão da
  // que veio do servidor; o React acusava (erro #418), remontava a página
  // inteira e o <html> perdia o data-tema — o site voltava para o claro.
  const contexto = await browser.newContext({ reducedMotion: "reduce" });
  const page = await contexto.newPage();
  const erros: string[] = [];
  page.on("pageerror", (e) => erros.push(e.message));
  page.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  await guardarEscolha(page, "escuro");

  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  expect(erros).toEqual([]);
  expect(await tema(page)).toBe("escuro");
  await contexto.close();
});

const TELAS = [
  "/",
  "/painel",
  "/apostas",
  "/historico",
  "/adms",
  "/estatisticas",
  "/nao-existe",
];

for (const nome of ["escuro", "claro"] as const) {
  test(`nenhum texto abaixo do contraste mínimo no tema ${nome}, nas sete telas`, async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    // Sem movimento, nada está no meio de uma animação de opacidade na hora
    // de medir.
    const contexto = await browser.newContext({ reducedMotion: "reduce" });
    const page = await contexto.newPage();
    await guardarEscolha(page, nome);
    const falhas: string[] = [];

    for (const tela of TELAS) {
      await page.goto(tela, { waitUntil: "networkidle" });
      await expect.poll(() => tema(page)).toBe(nome);
      await page.waitForTimeout(400);
      falhas.push(...(await textosSemContraste(page)).map((f) => `${tela} ${f}`));

      // O que só aparece com clique: diálogo e lista suspensa.
      if (tela === "/apostas") {
        await page
          .getByRole("button", { name: /^Ver detalhes: / })
          .first()
          .click();
        await expect(page.getByRole("dialog")).toBeVisible();
        falhas.push(
          ...(await textosSemContraste(page)).map((f) => `${tela} [detalhe] ${f}`)
        );
        await page.keyboard.press("Escape");
      }
      if (tela === "/estatisticas") {
        await page.getByRole("button", { name: "Ver todas as casas em detalhe" }).click();
        await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });
        falhas.push(
          ...(await textosSemContraste(page)).map((f) => `${tela} [casas] ${f}`)
        );
        await page.keyboard.press("Escape");
      }
    }

    expect(falhas).toEqual([]);
    await contexto.close();
  });
}
