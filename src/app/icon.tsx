import { ImageResponse } from "next/og";
import { MarcaG } from "@/components/MarcaG";
import { CORES } from "@/lib/cores";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Ícone da aba: o G orbital sobre o quadrado escuro.
 *
 * O quadrado fica: o ícone vai para a barra de abas, que é clara ou escura
 * conforme o navegador, e um G escuro em fundo transparente sumiria na
 * escura. O nó roxo sobre o quadrado é enfeite, não texto — 3,0:1 basta para
 * ele aparecer. O contorno dos nós é a cor do quadrado, o mesmo respiro que
 * a marca tem no site.
 */
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: CORES.text,
        borderRadius: 7,
      }}
    >
      <MarcaG tamanho={25} tinta={CORES.bg} no={CORES.accent} fundo={CORES.text} />
    </div>,
    size
  );
}
