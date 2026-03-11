# Arquitetura do MVP

## Objetivo do produto
- Calcular custo e preço de receitas alimentícias com base profissional.
- Reaproveitar ingredientes com histórico de preços.
- Nascer pronto para evolução para SaaS multiusuário.

## Decisões centrais
- `Next.js App Router + TypeScript` para UI, rotas protegidas e renderização híbrida.
- `Prisma + PostgreSQL (Neon)` para modelagem relacional e crescimento futuro.
- `Clerk` para autenticação e base pronta para Google/email no futuro.
- `Multi-tenant por workspace` desde o início, mesmo que o primeiro uso seja individual.
- `Server-first` para leitura, escrita e checagem de ownership.

## Modelo de tenancy
- Cada usuário autenticado é sincronizado na tabela `User`.
- Cada usuário recebe um `Workspace` pessoal no primeiro acesso.
- A tabela `WorkspaceMember` já prepara papéis (`OWNER`, `ADMIN`, `MEMBER`).
- Todas as entidades de negócio carregam `workspaceId`.

## Estratégia de modelagem
- Ingrediente mantém o snapshot mais recente para leitura rápida.
- `IngredientPriceHistory` registra cada alteração relevante de preço/compra/conversão.
- Receita armazena rendimento e porção vendida.
- `RecipeItem` sempre usa quantidade na unidade base normalizada do ingrediente.
- `PricingSettings` guarda defaults do workspace.
- `RecipePricingProfile` guarda a configuração operacional da receita.
- `PricingRun` guarda snapshot e resultados para histórico, auditoria e exportação.

## Estratégia de unidades
- Unidade base normalizada do ingrediente: `GRAM`, `MILLILITER` ou `UNIT`.
- Unidade de compra pode ser massa, volume ou embalagem (`KILOGRAM`, `LITER`, `DOZEN`, `BOX`, `POT`, etc.).
- `conversionFactor` representa quantas unidades base existem em 1 unidade de compra.
- Exemplo: 1 `POT` de 150 g => `purchaseUnit=POT`, `baseUnit=GRAM`, `conversionFactor=150`.

## Regras de cálculo do MVP
- Custo base dos ingredientes = soma de `recipeItem.quantityInBaseUnit * ingredient.unitCostInBaseUnit`.
- Custos modulares:
  - perda/quebra
  - embalagem
  - mão de obra
  - gás/energia
  - custo fixo rateado
  - taxa/comissão
  - impostos
  - margem alvo
- Resultados esperados:
  - custo total
  - custo por porção
  - preço mínimo sem prejuízo
  - preço com margem alvo
  - simulação de margens

## Estrutura inicial de pastas
```text
src/
  app/
    (auth)/
    (app)/
  components/
    layout/
    ui/
  features/
    pricing/
    units/
  lib/
  server/
prisma/
docs/
```

## Roadmap curto
1. Base do projeto, layout, auth e schema Prisma.
2. Helpers de tenancy, serviços e engine de precificação.
3. CRUD de ingredientes com histórico de preços.
4. CRUD de receitas e cálculo.
5. Exportações, revisão de UX e deploy.

## Simplificações inteligentes do MVP
- Primeiro ciclo com `1 workspace pessoal por usuário`, mas mantendo modelagem de membros.
- Sem painel admin e sem cobrança agora, porém schema já compatível com essa expansão.
- Unidades culinárias padronizadas por enum, evitando sistema arbitrário de medidas.
- Histórico de pricing por snapshot em `PricingRun`, sem gráficos neste primeiro corte.

## Principais riscos técnicos
- Integração Clerk + Prisma exige sincronização correta do usuário no primeiro login.
- Conversão de unidades de embalagem depende de dado confiável do usuário.
- Cálculo financeiro precisa usar decimal com cuidado para não introduzir erro de arredondamento.
- Deploy exige disciplina com migrations e variáveis de ambiente entre local, Neon e Vercel.
