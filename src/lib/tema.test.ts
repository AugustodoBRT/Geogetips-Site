import { describe, expect, it } from "vitest";
import { CHAVE_TEMA, ehTema, resolverTema, SCRIPT_TEMA_INICIAL } from "./tema";

describe("resolverTema", () => {
  it("a escolha guardada vale mais que o aparelho", () => {
    expect(resolverTema("claro", true)).toBe("claro");
    expect(resolverTema("escuro", false)).toBe("escuro");
  });

  it("sem escolha, segue o aparelho", () => {
    expect(resolverTema(null, true)).toBe("escuro");
    expect(resolverTema(null, false)).toBe("claro");
  });

  it("valor estranho no armazenamento conta como sem escolha", () => {
    expect(resolverTema("dark", true)).toBe("escuro");
    expect(resolverTema("", false)).toBe("claro");
  });
});

describe("ehTema", () => {
  it("aceita só os dois nomes", () => {
    expect(ehTema("claro")).toBe(true);
    expect(ehTema("escuro")).toBe(true);
    expect(ehTema("light")).toBe(false);
    expect(ehTema(undefined)).toBe(false);
  });
});

/** Executa o script do <head> num navegador de mentira e devolve o tema aplicado. */
function rodarScript(guardado: string | null | "bloqueado", aparelhoEscuro: boolean) {
  const documentElement = { dataset: {} as Record<string, string> };
  const localStorage = {
    getItem(chave: string) {
      if (guardado === "bloqueado") throw new Error("SecurityError");
      return chave === CHAVE_TEMA ? guardado : null;
    },
  };
  const matchMedia = (consulta: string) => ({
    matches: consulta === "(prefers-color-scheme: dark)" && aparelhoEscuro,
  });
  new Function("document", "localStorage", "matchMedia", SCRIPT_TEMA_INICIAL)(
    { documentElement },
    localStorage,
    matchMedia
  );
  return documentElement.dataset.tema;
}

describe("SCRIPT_TEMA_INICIAL", () => {
  it("concorda com resolverTema em todos os casos", () => {
    for (const guardado of ["claro", "escuro", null, "xyz"]) {
      for (const aparelhoEscuro of [true, false]) {
        expect(rodarScript(guardado, aparelhoEscuro)).toBe(
          resolverTema(guardado, aparelhoEscuro)
        );
      }
    }
  });

  it("com o armazenamento bloqueado, segue o aparelho em vez de quebrar", () => {
    expect(rodarScript("bloqueado", true)).toBe("escuro");
    expect(rodarScript("bloqueado", false)).toBe("claro");
  });
});
