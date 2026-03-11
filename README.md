# MARGEM APP

Calculadora de precificação para receitas alimentícias, com foco em controle de ingredientes, fichas técnicas, custo por porção e histórico de simulações.

## Visão geral

O MARGEM APP centraliza:

- catálogo de ingredientes com histórico de preços
- receitas com rendimento, porção vendida e composição
- cálculo de precificação por receita
- simulações salvas com snapshot do resultado
- isolamento por workspace no servidor

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL / Neon
- Clerk
- Vercel

## Rodando localmente

1. Instale as dependências:

```bash
npm install
```

2. Configure as variáveis de ambiente em `.env.local`.

3. Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

4. Abra `http://localhost:3000`.

## Scripts principais

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Estrutura funcional atual

- Ingredientes com custo base, conversão e histórico
- Produtos como visão comercial da mesma base de ingredientes
- Receitas com itens vinculados ao catálogo
- Precificação com custos adicionais, margem alvo e histórico em `PricingRun`
- Autenticação e workspace isolado por usuário

## Deploy

Fluxo recomendado:

1. Subir o projeto para o GitHub
2. Importar o repositório na Vercel
3. Configurar variáveis de ambiente
4. Validar autenticação, banco e build de produção
