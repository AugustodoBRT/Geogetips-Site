# GeogeTips - Plataforma Web de Análise e Monitoramento de Apostas

Dashboard moderno e analítico desenvolvido em **Next.js 15**, **React 19**, **Tailwind CSS** e **Lucide Icons** para acompanhar as apostas do grupo, métricas de assertividade, evolução da banca e o ranking dos adms, lidos diretamente da planilha do **Google Sheets**.

---

## Principais Funcionalidades

- **Painel de Performance**:
  - 5 KPIs: Lucro, ROI, Total de Apostas, Taxa de Acerto e Pendentes.
  - Gráfico de **Evolução da Banca** com a curva verde acima do zero e vermelha abaixo, inspeção dia a dia e maior queda do período.
  - Janelas de calendário (`7D`, `30D`, `90D`, `Tudo`; `120D` na visão de todos os meses).
  - Seletor de dia para recalcular os indicadores.
- **Feed de Apostas**:
  - Visualização em **Cards** ou **Tabela**, com detalhe da aposta em modal (Esc ou clique fora fecha).
  - Filtros por resultado, busca por texto, **intervalo de datas (de/até)**, **vários esportes e várias casas ao mesmo tempo** e faixa de odd.
  - Mais recente primeiro, inclusive dentro do mesmo dia.
- **Visão "Todos os Meses"**: agrega todas as abas mensais da planilha.
- **Histórico Mês a Mês**: resultado, ROI e taxa de acerto de cada mês lado a lado, com consolidado recalculado sobre a soma.
- **Estatísticas**: distribuição de resultados, médias de odd (green, red e geral), lucro e ROI por esporte e por casa.
- **Performance dos Adms**: acerto, volume, ROI, lucro em unidades e a composição das tips por resultado.
- **Unidade do visitante**: todos os valores em reais podem ser vistos na unidade de quem lê (ROI e taxa não mudam).
- **Logos das casas**: as 99 casas do registro têm logo em SVG, com o fundo de cada pílula medido para a logo ficar legível. Casa fora do registro aparece com o nome, em cinza.
- **Selos por esporte** (Futebol, Basquete, Tênis, F1, eSports, MMA, Vôlei, MLB, NHL, NFL, Turfe).

---

## Tecnologias Utilizadas

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Integração de Dados**: [Google Sheets API v4](https://developers.google.com/sheets/api) via `googleapis`

---

## Como Executar Localmente

### 1. Clonar o Repositório e Instalar Dependências
```bash
git clone https://github.com/AugustodoBRT/Geogetips-Site.git
cd Geogetips-Site
npm install
```

### 2. Variáveis de ambiente (opcionais)
**Não é preciso configurar nada para rodar.** A planilha do grupo está
compartilhada publicamente, e o site a lê por acesso anônimo — sem service
account, sem JSON, sem segredo para vazar no deploy.

Se um dia a planilha deixar de ser pública, aí sim configure uma service
account em `GOOGLE_SERVICE_ACCOUNT_JSON` (o JSON inteiro em uma linha). O
código detecta a credencial sozinho e passa a usar a API do Sheets no lugar da
leitura pública.

Para desenvolver sem tocar na planilha real, use o modo demonstração — que
serve dados fictícios **com aviso visível em todas as telas**:

```env
NEXT_PUBLIC_USE_MOCK=1
```

Falha de leitura nunca cai em dados falsos silenciosamente: erro aparece como erro.

### Como a leitura pública funciona
`src/lib/planilhaPublica.ts` busca o CSV de cada aba pelo endpoint `gviz` do
Google. Uma armadilha justifica o cuidado ali: **quando a aba não existe, o
gviz não retorna erro — ele devolve a primeira aba da planilha**. Sem
validação, um mês inexistente entraria no site com os dados de outro. Por isso
cada aba lida é conferida contra o mês que ela deveria conter, comparando a
coluna DATA com o nome da aba.

### Grupo e transparência
Duas constantes em `src/lib/constants.ts`, usadas em todos os pontos do site:

- `TELEGRAM_URL` — canal gratuito (`@vemproGeogeTips`). Quando o canal pago
  entrar, isto vira uma lista de destinos e o site ganha página de planos.
- `PLANILHA_URL` — planilha pública de resultados, em modo somente leitura.
  Aparece junto dos números em todas as telas de dados: é a prova de que o
  painel não maquia nada.

Nunca escreva esses links direto no JSX.

### Histórico mês a mês
`/historico` compara todos os meses da planilha lado a lado, via
`/api/resumo` — que devolve **só agregados por aba**, sem o array de apostas.

O consolidado é recalculado sobre a **soma** do período, nunca sobre a média
dos meses: ROI é razão, e média de razões não é a razão das somas. No exemplo
de demonstração o ROI real do período é 7,00% enquanto a média ingênua dos
ROIs mensais daria 13,47%.

### Métricas
- **ROI** = lucro ÷ total apostado, **incluindo pendentes e anuladas** no
  investido. É assim que a planilha do grupo calcula, e o site precisa bater
  com ela linha a linha. Não é intercambiável com taxa de acerto: 32% de
  acerto em odds 5 rende mais que 63% em odds 1,5.
- **Taxa de acerto** = greens ÷ (greens + reds). Pendente e void ficam de fora.
- **VOID** (anulada) é um quarto resultado, com stake devolvida e lucro zero.
  Fica fora do denominador da taxa, mas entra no investido do ROI. O parser reconhece "void",
  "anulada", "cancelado", "reembolsada" e "devolvido".

### 3. Rodar em Modo de Desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

### Cores
A paleta mora no `:root` de `src/app/globals.css`, e o código usa `-[var(--token)]`.
**Não escreva `bg-[var(--green)]/10`**: o Tailwind 3 não aplica opacidade a CSS
variable e a classe simplesmente não é gerada. Para tons suaves use os tokens
`--green-soft`, `--red-soft`, `--amber-soft`, `--accent-soft`, `--text-soft` e
`--text-2-soft`; para outra transparência, `color-mix` com a dica de tipo:
`border-[color:color-mix(in_srgb,var(--accent)_60%,transparent)]`.

`src/lib/cores.ts` repete os hexadecimais para o Satori, que não lê CSS variable.
Depois de mexer em qualquer um dos dois, rode `npm run checar:cores`.

### 4. Build de Produção
O build escreve na mesma pasta `.next` que o `npm run dev` usa, e derruba o
servidor de desenvolvimento que estiver no ar. Para só conferir se o build passa
sem parar o dev, mande-o para outra pasta e apague-a depois:

```bash
NEXT_DIST_DIR=.next-verifica npm run build
```

O Next reescreve `tsconfig.json` e `next-env.d.ts` para apontar para a pasta
nova. Descarte essas duas mudanças em seguida:

```bash
git checkout -- tsconfig.json next-env.d.ts && rm -rf .next-verifica
```

```bash
npm run build
npm run start
```
