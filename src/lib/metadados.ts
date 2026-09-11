import type { Metadata } from "next";

interface Pagina {
  titulo: string;
  descricao: string;
  caminho: string;
}

/**
 * Metadados de uma página interna.
 *
 * As páginas são client components e não podem exportar `metadata`, então cada
 * rota ganhou um layout.tsx só para isto. Antes as seis saíam com o mesmo
 * <title>: aba do navegador, histórico e resultado de busca não distinguiam o
 * Painel das Apostas.
 *
 * O openGraph vai inteiro, e não só o título: um openGraph declarado numa rota
 * substitui o do layout raiz em vez de se mesclar com ele, e o preview do link
 * perderia siteName e locale.
 */
export function metadadosDaPagina({ titulo, descricao, caminho }: Pagina): Metadata {
  const tituloCompleto = `${titulo} · GeogeTips`;
  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: caminho },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: "GeogeTips",
      url: caminho,
      title: tituloCompleto,
      description: descricao,
    },
    twitter: {
      card: "summary_large_image",
      site: "@GeogeTips",
      title: tituloCompleto,
      description: descricao,
    },
  };
}
