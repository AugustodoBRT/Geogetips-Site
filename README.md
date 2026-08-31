# GeogeTips - Plataforma Web de Análise e Monitoramento de Apostas

Dashboard moderno e analítico desenvolvido em **Next.js 15**, **React 19**, **Tailwind CSS** e **Lucide Icons** para acompanhamento em tempo real de palpites esportivos, métricas de assertividade, evolução da banca e rankings de tipsters integrados diretamente com o **Google Sheets**.

---

## Principais Funcionalidades

- **Painel de Performance em Tempo Real**:
  - 4 KPIs principais: Lucro Acumulado, Total de Apostas, Assertividade (%) e Pendentes.
  - Gráfico dinâmico e interativo de **Evolução da Banca** com tooltip de inspeção dia a dia.
  - Filtros de período inteligentes (`7D`, `30D`, `90D`, `120D`, `Tudo`) que se adaptam à visão mensal ou histórica.
  - Seletor de dia do mês para filtrar o painel e recalcular métricas instantaneamente.
- **Feed de Apostas**:
  - Visualização em **Cards** ou **Tabela Detalhada**.
  - Drawer modal com detalhes completos da tip (fecha com Esc ou clique fora).
  - Filtros avançados por esporte, casa de aposta, resultado (*GREEN*, *RED*, *PENDENTE*), busca por texto e seletor de dia.
  - Ordenação cronológica automática (apostas mais recentes sempre no topo).
- **Visão Geral Consolidada ("Todos os Meses")**:
  - Agregação em paralelo de todas as abas históricas do Google Sheets com cache em memória de alta performance.
- **Estatísticas Completas**:
  - Distribuição gráfica por modalidades e casas de aposta.
  - Comparativo de odds médias e assertividade por esporte.
- **Ranking de Tipsters**:
  - Leaderboard com assertividade, total de palpites, esportes atuados e lucro líquido em unidades.
- **Badges Oficiais & Identidade Visual**:
  - Badges com monogramas para 16 casas de apostas (Betano, Bet365, BetPix365, Novibet, Sportingbet, Superbet, KTO, Betfair, Stake, Betnacional, etc.). Casas não mapeadas aparecem com o nome real.
  - Pílulas com cor dedicada por esporte (Futebol, Basquete, Tênis, F1, eSports, MMA, Vôlei, MLB, NHL, NFL, Turfe).

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
- **ROI** = lucro ÷ total apostado, contando só apostas resolvidas. É a métrica
  que o mercado usa para comparar grupos, e não é intercambiável com taxa de
  acerto: 32% de acerto em odds 5 rende mais que 63% em odds 1,5.
- **Taxa de acerto** = greens ÷ (greens + reds). Pendente e void ficam de fora.
- **VOID** (anulada) é um quarto resultado, com stake devolvida e lucro zero.
  Fica fora do denominador da taxa e do ROI. O parser reconhece "void",
  "anulada", "cancelado", "reembolsada" e "devolvido".

### 3. Rodar em Modo de Desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

### 4. Build de Produção
```bash
npm run build
npm run start
```
