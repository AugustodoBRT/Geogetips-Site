# Geogetips - Plataforma Web de Análise e Monitoramento de Apostas

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
  - Drawer modal com detalhes completos da tip e link direto para verificação.
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
  - Badges coloridas com monogramas oficiais para 16+ casas de apostas (Betano, Bet365, Novibet, Sportingbet, Superbet, KTO, Betfair, Stake, etc.).
  - Pílulas com paleta de cores dedicada para cada esporte (Futebol, Basquete, Tênis, F1, eSports, MMA, Vôlei, MLB, NHL, NFL).

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

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz:
```env
GOOGLE_SPREADSHEET_ID=sua_planilha_id
```

Certifique-se de disponibilizar o arquivo `credenciais.json` da conta de serviço Google Cloud para leitura da planilha.

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
