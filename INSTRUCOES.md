# FINCCA — Sistema de Votação
## Instruções de instalação e configuração

---

## 1. Pré-requisitos

- Node.js 20 ou superior
- Conta no [Supabase](https://supabase.com) (gratuita)
- Conta na [Vercel](https://vercel.com) (gratuita)

---

## 2. Configurar o Supabase

### 2.1 Criar projeto
1. Acesse [supabase.com](https://supabase.com) → New Project
2. Escolha um nome (ex: `fincca-votacao`) e uma senha forte para o banco
3. Aguarde o projeto iniciar

### 2.2 Executar o schema
1. No painel do Supabase, vá em **SQL Editor**
2. Cole e execute o conteúdo do arquivo `supabase/schema.sql`
3. Em seguida, execute o arquivo `supabase/seed.sql` para criar critérios e categorias

### 2.3 Configurar autenticação Google (opcional)
1. No Supabase, vá em **Authentication → Providers → Google**
2. Habilite o Google provider
3. Crie um projeto no [Google Cloud Console](https://console.cloud.google.com)
4. Crie credenciais OAuth 2.0 (tipo: Web application)
5. Adicione como URI de redirecionamento autorizado:
   ```
   https://SEU_PROJETO.supabase.co/auth/v1/callback
   ```
6. Cole o Client ID e Client Secret no Supabase

### 2.4 Pegar as chaves da API
1. Vá em **Settings → API**
2. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (usado para criar jurados)

---

## 3. Configurar o projeto localmente

### 3.1 Instalar dependências
```bash
cd "app festival de cinema cabo frio (jurados)"
npm install
```

### 3.2 Criar arquivo de variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto:
```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3.3 Rodar em modo desenvolvimento
```bash
npm run dev
```

Acesse: http://localhost:3000

---

## 4. Criar o primeiro administrador

1. Acesse http://localhost:3000/admin/login
2. Clique em "Esqueci a senha" ou use o Supabase para criar o usuário:
   - Vá em **Authentication → Users → Add User** no Supabase
   - Informe o e-mail e senha do admin
3. Após criar, pegue o **UUID** do usuário em **Authentication → Users**
4. Vá em **SQL Editor** e execute:
   ```sql
   update profiles set role = 'admin' where id = 'UUID_DO_USUARIO_AQUI';
   ```
5. Faça login em `/admin/login` com as credenciais criadas

---

## 5. Primeiros passos no painel admin

1. **Cadastrar filmes**: `/admin/filmes/novo`
2. **Cadastrar jurados**: `/admin/jurados` → crie nome, e-mail e senha para cada jurado
3. **Abrir votação**: no Dashboard, clique em "Abrir votação"
4. **Distribuir o link**: `/votar` para o público, ou gere um QR Code para este URL

---

## 6. Deploy na Vercel

### 6.1 Via interface web (mais fácil)
1. Crie uma conta na [Vercel](https://vercel.com)
2. Clique em **New Project → Import Git Repository**
3. Suba o código para um repositório no GitHub primeiro:
   ```bash
   git init
   git add .
   git commit -m "FINCCA votação — versão inicial"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/fincca-votacao.git
   git push -u origin main
   ```
4. Importe o repositório na Vercel
5. Na tela de configuração, adicione as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` → URL da Vercel (ex: `https://fincca-votacao.vercel.app`)
6. Clique em **Deploy**

### 6.2 Via CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

### 6.3 Após o deploy
1. Atualize `NEXT_PUBLIC_SITE_URL` com a URL final da Vercel
2. No Supabase, vá em **Authentication → URL Configuration** e adicione:
   - **Site URL**: `https://sua-url.vercel.app`
   - **Redirect URLs**: `https://sua-url.vercel.app/auth/callback`

---

## 7. Estrutura de URLs do sistema

| URL | Descrição |
|-----|-----------|
| `/` | Página inicial com os três acessos |
| `/votar` | Formulário de votação do Júri Popular |
| `/votar/confirmacao` | Confirmação após voto |
| `/jurado/login` | Login dos jurados técnicos |
| `/jurado` | Dashboard do jurado (lista de filmes) |
| `/jurado/avaliar/[id]` | Formulário de avaliação técnica |
| `/admin/login` | Login do administrador |
| `/admin` | Dashboard administrativo |
| `/admin/filmes` | Gerenciar filmes |
| `/admin/jurados` | Gerenciar jurados |
| `/admin/categorias` | Gerenciar categorias de premiação |
| `/admin/resultados` | Ver resultados em tempo real |
| `/admin/relatorios` | Exportar PDF e Excel |

---

## 8. Gerar QR Code para votação popular

Use qualquer gerador gratuito de QR Code com a URL:
```
https://sua-url.vercel.app/votar
```
Sugestão: [qr.io](https://qr.io) ou [goqr.me](https://goqr.me)

---

## 9. Fluxo durante o evento

1. **Antes**: cadastre filmes e jurados; abra a votação no painel admin
2. **Durante**: público acessa `/votar` pelo celular ou QR Code; jurados acessam `/jurado`
3. **Após**: feche a votação; acesse `/admin/resultados` para ver ranking; exporte PDF/Excel em `/admin/relatorios`

---

## 10. Reutilização para outros festivais

Para adaptar para outro evento:
1. Atualize o nome do festival em **SQL Editor**:
   ```sql
   update festivals set name = 'NOME DO NOVO FESTIVAL', year = 2026 where id = 'ID_DO_FESTIVAL';
   ```
2. Limpe filmes e jurados antigos ou crie um novo projeto Supabase
3. Ajuste cores em `tailwind.config.ts` (paleta `primary`) e troque `public/logo.png`

---

## 11. Suporte

Problemas com o sistema? Verifique:
- [ ] Variáveis de ambiente configuradas corretamente
- [ ] Schema SQL executado no Supabase
- [ ] URL de callback do Google configurada (se usar login Google)
- [ ] `NEXT_PUBLIC_SITE_URL` aponta para a URL correta de produção
- [ ] Usuário admin tem `role = 'admin'` na tabela `profiles`

---

*Sistema desenvolvido para o FINCCA — EcoBúzios / Associação Bem Querer*
*Modular e adaptável para mostras culturais, editais e outros eventos.*
