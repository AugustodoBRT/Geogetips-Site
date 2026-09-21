import { expect, test } from "@playwright/test";

/**
 * Os dois defeitos que mexiam com número na tela, achados na varredura.
 *
 * Nenhum dos dois quebrava nada: a unidade digitada com ponto de milhar
 * simplesmente mostrava o site cem vezes menor, e a busca simplesmente
 * escondia metade das apostas do time procurado. É o tipo de defeito que só
 * aparece quando alguém usa.
 */

test("unidade digitada com ponto de milhar vale mil, não um", async ({ page }) => {
  await page.goto("/painel");
  const campo = page.getByLabel("Valor de 1 unidade em reais");
  await expect(campo).toBeVisible({ timeout: 15_000 });

  await campo.fill("1.000");
  await campo.blur();

  // O que ficou guardado é o que vale para todas as telas.
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("geogetips:unidade")))
    .toBe("1000");
  // E o campo devolve o número escrito como o site escreve.
  await expect(campo).toHaveValue("1.000");
});

test("unidade fora dos limites é recusada, e a tela diz", async ({ page }) => {
  await page.goto("/painel");
  const campo = page.getByLabel("Valor de 1 unidade em reais");
  await expect(campo).toBeVisible({ timeout: 15_000 });

  await campo.fill("99999999999");
  await campo.blur();

  await expect(page.getByText(/Valor não aceito/)).toBeVisible();
  await expect(campo).toHaveValue("100");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("geogetips:unidade")))
    .toBeNull();
});

test("a busca acha o time escrito com e sem acento", async ({ page }) => {
  await page.goto("/apostas");
  const busca = page.getByLabel("Buscar apostas");
  await expect(busca).toBeVisible({ timeout: 15_000 });

  const cartoes = page.getByRole("button", { name: /^Ver detalhes: / });
  const semAcento = (t: string) =>
    t
      .normalize("NFD")
      // biome-ignore lint/suspicious/noMisleadingCharacterClass: é a faixa das marcas de acentuação combinantes, e removê-las é justamente o que se quer aqui.
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();

  /**
   * Espera o recorte assentar antes de contar.
   *
   * A busca é adiada em 250 ms de propósito, então logo depois de digitar ainda
   * estão na tela os cartões da busca anterior — contar ali dava 11, o feed
   * inteiro, e o teste falhava sozinho de vez em quando. O sinal de que o
   * recorte chegou é todo cartão visível casar com o termo.
   */
  const procurar = async (termo: string) => {
    await busca.fill(termo);
    const alvo = semAcento(termo);
    await expect
      .poll(
        async () => {
          const rotulos = await cartoes.evaluateAll((els) =>
            els.map((e) => e.getAttribute("aria-label") ?? "")
          );
          return rotulos.length > 0 && rotulos.every((r) => semAcento(r).includes(alvo));
        },
        { timeout: 8000 }
      )
      .toBe(true);
    return cartoes.count();
  };

  // O mesmo time, escrito das duas formas, tem de dar a mesma lista.
  expect(await procurar("Milão")).toBe(await procurar("milao"));
  expect(await procurar("MILAO")).toBe(await procurar("milão"));
});
