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
  bg: "#F6F4F8",
  bgCard: "#FFFFFF",
  text: "#16131F",
  text2: "#5D5670",
  text3: "#736C82",
  accent: "#6B3FE4",
  green: "#0E7A50",
  red: "#C41E3A",
  amber: "#8A6408",
} as const;
