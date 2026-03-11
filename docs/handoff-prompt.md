# Prompt de continuidade do projeto

Use o texto abaixo para retomar este projeto em uma nova conversa sem perder contexto.

```text
Quero que voce continue o desenvolvimento deste projeto existente em:

c:\Users\Alvaro Amorim\Desktop\calculadora receitas

Atue como meu engenheiro de software principal, arquiteto de produto e guia tecnico passo a passo.

IMPORTANTE
- Fale em portugues do Brasil
- Nao reinicialize o projeto
- Nao recrie a base
- Nao altere segredos do .env.local
- Nao peca para eu colar chaves sensiveis no chat
- Preserve a arquitetura SaaS-ready ja construida
- Sempre valide com lint, typecheck e build quando fizer mudancas relevantes
- Sempre me entregue implementacao real, nao so teoria
- Sempre leia o codigo atual antes de decidir
- So pergunte se houver ambiguidade estrutural real
- Se puder decidir sem me bloquear, decida e explique
- Nunca dependa do front-end para proteger dados
- Sempre filtre por workspaceId no servidor
- Nunca exponha dados de outro usuario

Ao final de cada etapa, diga:
- o que voce fez
- quais arquivos criou/alterou
- como testar
- o que eu preciso fazer fora do VS Code
- qual e a proxima etapa
- Estado atual do projeto
- Proxima acao dentro do VS Code
- Proxima acao fora do VS Code

CONTEXTO DO PRODUTO
Este e um MVP de app de precificacao de receitas alimenticias com base para evoluir para SaaS.

STACK
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui style base
- Prisma ORM
- PostgreSQL
- Neon
- Clerk
- Vercel
- SheetJS
- PDF ainda nao implementado

ESTADO ATUAL CONFIRMADO
- Next.js base criada e funcionando
- Prisma 7 configurado com prisma.config.ts
- Neon configurado
- Migration inicial aplicada com sucesso
- Clerk configurado e login funcionando
- Dashboard protegido funcionando
- Multi-tenant por workspace funcionando
- Sync de usuario/workspace funcionando no servidor
- Engine de precificacao isolada em TypeScript
- Modulo de ingredientes/produtos implementado com:
  - listagem por workspace
  - criacao
  - edicao
  - confirmacao de preco igual
  - registro de novo preco
  - historico de precos
  - calculo de custo por unidade base
  - categoria com sugestao/autocomplete e canonizacao server-side
  - campos de marca e local da compra
  - pagina de cadastro continuo em /ingredients/new, permanecendo no formulario apos salvar
  - pagina /products separada, agrupada por categoria e recolhida por padrao
  - pagina individual do produto em /products/[productId]
  - destaque do ultimo preco, marca e local
  - grafico de evolucao de preco com mensagem amigavel quando houver so 1 registro
  - exclusao permanente no detalhe tecnico /ingredients/[ingredientId]
  - confirmacao antes de excluir
  - bloqueio de exclusao quando o ingrediente estiver vinculado a receitas
- Modulo de receitas implementado com:
  - listagem por workspace
  - criacao
  - edicao
  - itens usando ingredientes existentes
  - validacao de ownership por workspace no servidor
  - estrutura pronta para enviar receita para a engine de precificacao
  - criacao automatica de RecipePricingProfile padrao
- Build, lint e typecheck estavam passando na ultima etapa validada

ARQUITETURA E REGRAS IMPORTANTES
- Ingrediente e produto sao a mesma entidade de dominio; /products e a visao comercial da mesma base de /ingredients
- Toda leitura e escrita sensivel fica server-side
- Historico de preco fica em IngredientPriceHistory
- RecipeItem usa quantidade em unidade base normalizada
- RecipePricingProfile e PricingRun existem no schema, mas a tela real de precificacao ainda nao foi concluida
- O banco ja esta modelado para multi-tenant e pronto para evolucao SaaS

ARQUIVOS IMPORTANTES PARA LER PRIMEIRO
- docs/architecture.md
- docs/handoff-prompt.md
- prisma/schema.prisma
- prisma.config.ts
- src/lib/auth.ts
- src/lib/db.ts
- src/server/tenancy.ts
- src/server/ingredients/service.ts
- src/server/recipes/service.ts
- src/app/(app)/ingredients/actions.ts
- src/app/(app)/ingredients/page.tsx
- src/app/(app)/ingredients/new/page.tsx
- src/app/(app)/ingredients/[ingredientId]/page.tsx
- src/app/(app)/products/page.tsx
- src/app/(app)/products/[productId]/page.tsx
- src/app/(app)/recipes/page.tsx
- src/app/(app)/recipes/new/page.tsx
- src/app/(app)/recipes/[recipeId]/page.tsx
- src/components/ingredients/ingredient-form.tsx
- src/components/ingredients/ingredient-price-history.tsx
- src/components/products/product-price-chart.tsx
- src/components/recipes/recipe-form.tsx
- src/features/pricing/engine.ts
- src/features/units/conversion.ts

O QUE JA FOI FEITO DE FORMA PRATICA
- Base do app, autenticacao, tenancy e workspace pessoal
- CRUD de ingredientes com historico
- Visao de produtos separada e orientada a catalogo
- Categoria padronizada para evitar duplicidade por grafia
- Marca e local da compra integrados no cadastro e historico
- Exclusao segura de ingrediente/produto com confirmacao e revalidacao
- CRUD completo de receitas com itens e preparacao para precificacao

O QUE AINDA FALTA PARA FINALIZAR A APLICACAO
1. Tela real de precificacao
- Trocar a pagina placeholder de /pricing por fluxo real
- Permitir selecionar receita do workspace
- Carregar dados da receita pelo service ja existente
- Permitir editar modulos de custo
- Rodar a engine com dados reais
- Persistir PricingRun
- Mostrar resultado salvo e historico de simulacoes

2. Configuracoes de precificacao
- Criar UI para PricingSettings por workspace
- Permitir defaults operacionais globais
- Permitir revisar/editar RecipePricingProfile da receita

3. Exportacoes
- Exportacao Excel com SheetJS
- Exportacao PDF
- Preparar snapshots de pricing para relatorios

4. UX de catalogo e produtividade
- Busca e filtros em produtos e ingredientes
- Melhorias de feedback, empty states e mensagens de erro
- Opcional: unificar melhor a nomenclatura produto vs ingrediente na interface

5. Robustez de produto
- Testes automatizados de services e regras criticas
- Revisao de permissoes e fluxos de erro
- Checklist de deploy e operacao em Vercel/Neon/Clerk

FORMA DE TRABALHO
- Primeiro leia o codigo atual
- Depois me diga, de forma curta, o que ja existe e o que vai implementar
- Em seguida implemente direto
- Nao entregue so plano, faca a mudanca real
- Sempre que fizer mudanca relevante, valide com:
  - npm run lint
  - npm run typecheck
  - npm run build

PROXIMO OBJETIVO RECOMENDADO
Implemente agora a tela real de precificacao em /pricing, conectada ao modulo de receitas ja existente e persistindo PricingRun.
```
