"use client";

import NumberFlow, { type Format } from "@number-flow/react";

interface NumeroAnimadoProps {
  value: number;
  locales?: string;
  format?: Format;
  prefix?: string;
  suffix?: string;
}

/**
 * O número que rola até o valor — e que se lê como número.
 *
 * O NumberFlow desenha cada algarismo num elemento próprio, para animar um por
 * um, e não expõe o valor formatado. A árvore de acessibilidade do Painel trazia
 * `+ R$ 1 2 . 2 1 2 , 9 5`, e é isso que um leitor de tela falava: "um, dois,
 * ponto, dois, um, dois..." no lugar de doze mil duzentos e doze reais.
 *
 * Aqui o valor vai escrito por extenso para quem ouve, com a mesma formatação
 * que o NumberFlow usa (os dois passam por `Intl.NumberFormat`), e a animação
 * fica escondida da leitura. Quem enxerga não percebe diferença nenhuma.
 */
export function NumeroAnimado({
  value,
  locales = "pt-BR",
  format,
  prefix = "",
  suffix = "",
}: NumeroAnimadoProps) {
  const texto = `${prefix}${new Intl.NumberFormat(locales, format).format(value)}${suffix}`;

  return (
    <>
      <span className="sr-only">{texto}</span>
      <span aria-hidden="true">
        <NumberFlow
          value={value}
          locales={locales}
          format={format}
          prefix={prefix}
          suffix={suffix}
        />
      </span>
    </>
  );
}
