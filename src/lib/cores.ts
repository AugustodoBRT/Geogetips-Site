/**
 * Paleta em hexadecimal literal.
 *
 * O site inteiro lê cor de `--token` no globals.css. Este arquivo existe só
 * para os três lugares que NÃO conseguem resolver CSS variable:
 *
 *   - `icon.tsx` e `opengraph-image.tsx` renderizam no Satori (next/og), que
 *     não tem cascata de CSS e ignora `var()`;
 *   - o `themeColor` do metadata vira uma meta tag, e o navegador espera um
 *     valor literal ali.
 *
 * Os valores precisam bater com o bloco `:root` do globals.css. Rode
 * `npm run checar:cores` depois de mexer em qualquer um dos dois.
 */
export const CORES = {
  bg: "#F7F5F0",
  bgCard: "#FFFFFF",
  text: "#1A1715",
  text2: "#6B645A",
  text3: "#9E9689",
  accent: "#C7522A",
  green: "#2D8659",
  red: "#C23B22",
  amber: "#B8860B",
} as const;
