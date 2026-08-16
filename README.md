# Themis — Sistema de Apuração de Transgressões Disciplinares

Aplicação de produção para condução do **PATD** (Processo Administrativo de
Transgressão Disciplinar) do **BINFAE-RJ** (Batalhão de Infantaria da
Aeronáutica Especial do Rio de Janeiro), a partir do protótipo de
demonstração aprovado. Cobre a máquina de estados de 10 etapas do processo,
o motor de prazos (dias úteis + feriados/ICA 111-6), geração dos ~13
documentos/anexos com assinatura eletrônica avançada (Lei nº 14.063/2020) e
trilha de auditoria imutável.

## Stack

- **Next.js 15** (App Router, TypeScript, Server Actions) — sem framework de
  API separado; toda a lógica de servidor vive em `lib/actions` e
  `app/**/page.tsx`.
- **PostgreSQL** via **Prisma ORM** (`prisma/schema.prisma`).
- Autenticação própria: login por **SARAM**, cookie de sessão assinado
  (JWT/`jose`), senhas com `bcryptjs`. Sem dependência de NextAuth — a
  regra de negócio (senha inicial = SARAM, troca obrigatória) é simples o
  bastante para não justificar essa dependência extra.
- CSS "vanilla" com variáveis (`app/globals.css`), consumindo a paleta
  institucional da FAB em `design-tokens/` — sem Tailwind nas telas
  principais (mantido no projeto, mas o visual replica fielmente o artefato
  aprovado).

## Como rodar localmente

### 1. Banco de dados

Qualquer Postgres 14+ serve. Localmente:

```bash
# Debian/Ubuntu já com postgresql instalado:
pg_ctlcluster 16 main start
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE themis;"
```

### 2. Variáveis de ambiente

```bash
cp .env.example .env
# gere um segredo forte para AUTH_SECRET:
openssl rand -base64 32
```

### 3. Instalar, migrar, semear

```bash
npm install
npm run db:migrate   # aplica prisma/migrations/*
npm run db:seed      # cadastra a OM (BINFAE-RJ) e a conta de homologação
npm run dev
```

Acesse `http://localhost:3000`. Login: **SARAM** cadastrado no seed; senha
inicial = **o próprio SARAM** (troca obrigatória no primeiro acesso).

## Modelo de autenticação

- **Usuário** = SARAM (6 a 8 dígitos). **Senha inicial** = SARAM.
- No primeiro login, `Conta.deveTrocarSenha = true` força redirecionamento
  para `/trocar-senha` antes de liberar qualquer outra tela (aplicado no
  `middleware.ts`, não só na UI).
- Senhas com `bcrypt` (12 rounds). Política mínima na troca: 8+ caracteres,
  letras e números, diferente do SARAM (`lib/auth/senha.ts`).
- Sessão: cookie `httpOnly`/`secure` (em produção)/`sameSite=lax` contendo
  um JWT HS256 de 12h (`lib/auth/session.ts`). Sem refresh automático —
  expira e pede novo login.
- Bloqueio simples por tentativas: 5 falhas em 15 min bloqueiam novas
  tentativas para aquela conta (`lib/actions/auth.ts`). É uma proteção
  ingênua baseada em contagem no próprio banco — ver checklist de produção
  abaixo para um rate limit de verdade.
- Todo login (sucesso ou falha) é registrado em `LogAcesso`.

## Controle de acesso (RBAC)

Quatro perfis — `COMANDANTE`, `ADMIN`, `APURADOR`, `ARROLADO`
(`lib/domain/rbac.ts`):

- **COMANDANTE**, **ADMIN** e **APURADOR** são papéis funcionais
  **concedidos** à conta (`Conta.perfisFuncionais`) pelo Admin, na tela
  "Usuários" (`/usuarios`), que também é onde novos militares/contas são
  cadastrados (`lib/actions/usuarios.ts`). COMANDANTE e ADMIN refletem um
  cargo real na OM e valem para todos os processos. **APURADOR já é
  diferente**: conceder esse perfil só marca **elegibilidade** — define
  quem aparece para ser escolhido como "Oficial apurador designado" ao
  autuar um processo (`app/(app)/processos/[id]/page.tsx`) — e não concede
  poder de agir como apurador em processo algum. Esse poder continua
  sempre derivado da relação com um processo específico
  (`processo.apuradorId`), atribuída caso a caso na autuação; por isso
  `perfisEfetivos()` em `lib/domain/rbac.ts` descarta o APURADOR "global"
  de `perfisFuncionais` e só o reconcede quando a conta é de fato a
  apuradora designada daquele processo.
- **ARROLADO** **nunca é concedido**: é sempre derivado da relação do
  militar com um processo específico (`processo.arroladoId`), porque
  qualquer militar pode vir a ser arrolado num processo concreto.
- `Conta.acessoTotalTeste` é uma bandeira **exclusiva de homologação**:
  faz a conta enxergar/agir como se detivesse os 4 perfis em qualquer
  processo — usada agora para uma única pessoa percorrer o fluxo inteiro
  sozinha. **Precisa ser desligada antes de operar com processos reais**
  (ver checklist).

## Estado atual dos dados (seed)

O `prisma/seed.ts` cadastra **apenas**:

- OM: BINFAE-RJ.
- 1 militar: 1° Ten QOINF Renan Henrique Vaz Borges, SARAM 6571590.
- 1 conta com `perfisFuncionais: [COMANDANTE, ADMIN]` e
  `acessoTotalTeste: true`.

Não há outros militares/contas fictícias — de propósito, para não inventar
identidades de terceiros. Para testar o fluxo com mais de uma pessoa real,
cadastre novos militares/contas pela tela de administração (Admin →
"Usuários", em `/usuarios`).

## Verificação de ponta a ponta já realizada

Nesta sessão, validei manualmente (Playwright + Postgres local) o ciclo
completo de um PATD: login → troca de senha → abertura → autuação →
ciência → defesa → apuração (recebimento + relatório) → despacho → decisão
(punição) → ciência da decisão, com geração e assinatura eletrônica correta
de todos os documentos (hash SHA-256 + protocolo), e conferi visualmente o
painel, a lista de processos, o detalhe do processo (trilha, dossiê,
auditoria) e o visualizador de documento. Não deixei um script de teste
automatizado no repositório — é o próximo item natural do checklist.

## O que falta para produção

Isto roda hoje contra um banco real e permite testar o fluxo inteiro. Antes
de operar com processos reais de militares, faltam:

### Infraestrutura
- [ ] Provisionar o banco definitivo (Supabase Postgres, ou outro Postgres
      gerenciado) e apontar `DATABASE_URL` de produção — não conectei a
      nenhuma nuvem nesta sessão, por decisão sua.
- [ ] Deploy no Vercel (ou outro host) com `AUTH_SECRET` forte e único por
      ambiente, gerado fora deste repositório.
- [ ] Decidir se a hospedagem em nuvem pública (EUA) é adequada para dados
      de processos disciplinares reais, ou se é exigida infraestrutura
      governamental/on-prem — isto é uma decisão institucional, não técnica.
- [ ] Backups automáticos do banco e política de retenção.
- [ ] Armazenamento de anexos de apoio (evidências) — o modelo `AnexoApoio`
      já existe no schema, mas o upload real (Supabase Storage/S3) não foi
      implementado; hoje não há como anexar arquivos às ações.

### Identidade e acesso
- [ ] Cadastrar uma conta por titular de função real e **desligar
      `acessoTotalTeste`** da conta de homologação (ou removê-la).
- [x] Tela de administração de militares/contas (Admin → `/usuarios`):
      cadastro de militar + conta (senha inicial = SARAM) e edição de
      perfis funcionais/ativação da conta. Falta ainda: edição de dados
      cadastrais de um militar já existente e exclusão de conta.
- [ ] Avaliar integração real com SARAM/SIGPES para cadastro/autenticação
      federada — está fora do escopo atual, cadastro é manual (como já era
      o caso no protótipo aprovado).
- [ ] Rate limiting de login mais robusto (hoje é uma contagem simples no
      Postgres; considerar um limitador dedicado, por IP e por conta).
- [ ] Mecanismo de revogação de sessão ativa antes da expiração do JWT (hoje
      não existe blacklist — só a expiração de 12h resolve).

### Domínio jurídico
- [ ] Substituir a amostra ilustrativa de 12 itens do art. 10 do RDAER
      (`lib/domain/catalogo.ts`) pela carga oficial dos 116 itens do
      Decreto nº 76.322/1975.
- [ ] Revisão jurídica formal (SIJ/AGU) do texto de cada documento gerado
      (`components/documentos/Anexos.tsx`) — portado fielmente do artefato
      aprovado, mas nunca substitui validação jurídica antes do uso real.
- [ ] Conferir se há feriados/pontos facultativos locais do Rio de Janeiro
      que devam somar-se aos feriados nacionais no motor de prazos
      (`lib/domain/prazos.ts`).

### Segurança
- [ ] Revisão de segurança / teste de intrusão antes de operar com dados
      reais e sigilosos.
- [ ] Confirmar enquadramento LGPD/sigilo (Lei nº 12.527/2011, art. 31) com
      a assessoria jurídica — a UI já sinaliza a classificação, mas isso não
      substitui parecer formal.
- [ ] Cabeçalhos de segurança HTTP (CSP, HSTS etc.) — não configurados.

### Qualidade
- [ ] Testes automatizados (unitários no motor de prazos/RBAC/transições;
      E2E no fluxo completo). Só há validação manual até aqui.
- [ ] Acessibilidade dos modais (falta focus-trap e retorno de foco ao
      fechar).
- [ ] Geração de PDF "de verdade" para os documentos — hoje usa o
      print-to-PDF do navegador (`window.print()` com CSS `@media print`),
      suficiente para o piloto, mas vale um gerador server-side depois.
- [ ] Logging estruturado e monitoramento em produção.

## Aviso de build conhecido (inofensivo)

`next build` mostra um aviso sobre `jose` usar `CompressionStream`/
`DecompressionStream` (APIs de JWE) não suportadas no Edge Runtime, porque o
`middleware.ts` roda em Edge e importa `jose` para verificar o JWT. Só uso
JWS (assinatura/verificação), nunca JWE (criptografia), então esse caminho
de código nunca é executado — confirmado rodando o fluxo de login completo
em `next dev`. Não é um erro de build nem impede o deploy.

## Estrutura do projeto

```
app/                        Rotas (App Router)
  login/, trocar-senha/     Públicas / pós-login obrigatório
  (app)/                    Shell autenticado (sidebar + topbar)
    painel/                 Dashboard (só Comandante)
    processos/               Lista, novo processo, detalhe
    usuarios/                Lista e cadastro de militares/contas (só Admin)
  processos/[id]/documentos/[docId]/   Visualizador de documento (sem sidebar, imprimível)
components/                 UI (formulários de ação, trilha, chips, documentos/)
lib/
  domain/                   Regras de negócio puras (prazos, estados, RBAC, transições, catálogos)
  actions/                  Server Actions (auth, processos, usuarios) — RBAC reforçado no servidor
  auth/                     Sessão, senha
  queries/                  Leituras compostas (painel, lista, detalhe, usuários)
prisma/
  schema.prisma             Modelo de dados completo
  seed.ts                   Seed de homologação
design-tokens/              Paleta institucional FAB (fonte da verdade de cor)
```
