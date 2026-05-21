# Guia de Migração para Supabase & Deploy no Render
Este guia detalha os passos realizados para preparar o sistema de **Ranqueamento de CVs** para o banco de dados em nuvem **Supabase** (PostgreSQL) e fornece o roteiro completo de deploy no **Render**.

---

## 🛠️ O Que Foi Implementado

Para realizar a migração sem quebrar a flexibilidade de desenvolvimento local, a arquitetura foi aprimorada com as seguintes alterações:

1. **`backend/requirements.txt`**: Adicionada a biblioteca `psycopg2-binary>=2.9.0` para permitir a conexão nativa com o banco de dados PostgreSQL.
2. **`backend/database.py`**: Refatorado para suportar carregamento dinâmico de variáveis de ambiente.
   * Se a variável `DATABASE_URL` estiver configurada no `.env` ou no ambiente do servidor, o backend se conectará ao **PostgreSQL/Supabase**.
   * Se não estiver configurada, o sistema usará o **SQLite local (`cv_ranking.db`)** como fallback.
   * Conexões que começam com `postgres://` são automaticamente corrigidas para `postgresql://` (uma exigência do SQLModel/SQLAlchemy).
   * Parâmetros do SQLite (`check_same_thread`) são aplicados apenas quando rodando localmente em SQLite.
3. **`backend/supabase_schema.sql`**: Um arquivo SQL completo contendo as definições de DDL (Data Definition Language) para a criação manual das tabelas (`vaga`, `candidato`, `analisecv`) no painel do Supabase, caso queira inicializar a estrutura visualmente.
4. **`backend/migrate_to_supabase.py`**: Um script automatizado que lê todo o seu banco de dados SQLite local (`cv_ranking.db`) e migra suas vagas cadastradas, candidatos salvos e análises de currículos para o Supabase de forma inteligente, evitando duplicados.

---

## ☁️ Passo 1: Configurar o Supabase

1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e crie um novo projeto.
2. Defina uma senha forte para o banco de dados (guarde-a bem).
3. Aguarde alguns minutos até o provisionamento do projeto ser concluído.
4. No menu lateral do Supabase, acesse **Project Settings (Ícone de engrenagem) > Database**.
5. Em **Connection String**, selecione a aba **URI** ou **Transaction** (para pool de conexões rápido) e copie a URL de conexão.
   * Ela se parecerá com isto:
     `postgresql://postgres.[SEU_SUBDOMAIN]:[SUA_SENHA]@aws-0-[REGIAO].pooler.supabase.com:6543/postgres`
   * > [!IMPORTANT]
     > Lembre-se de substituir `[SUA_SENHA]` pela senha real que você definiu ao criar o projeto.

---

## 🚀 Passo 2: Executar a Migração de Dados Locais

Se você já possui dados cadastrados localmente (vagas criadas, candidatos avaliados) e deseja migrá-los para o Supabase:

1. No seu arquivo `backend/.env`, adicione a variável `DATABASE_URL` com a string de conexão que você copiou do Supabase:
   ```env
   DATABASE_URL=postgresql://postgres.xxxxxx:senha_real@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
2. Execute o script de migração automática:
   ```bash
   cd backend
   ./.venv/bin/python migrate_to_supabase.py
   ```
   O script irá verificar a conexão com o Supabase, criar a estrutura das tabelas automaticamente se não existirem, e copiar de forma inteligente todos os seus dados do SQLite local para a nuvem.

> [!NOTE]
> Se o seu banco local estiver vazio ou se você não quiser reaproveitar os dados anteriores, você pode pular esta etapa de migração. Ao iniciar a API pela primeira vez no Render, as tabelas serão criadas de forma 100% automatizada pelo `init_db()` do FastAPI.

---

## 🖥️ Passo 3: Deploy no Render

A estrutura atual está 100% pronta para ser subida para o **Render**. Você tem duas abordagens principais: usando **Docker** (recomendado, pois já temos os `Dockerfile`s otimizados na pasta de cada serviço) ou deploy nativo.

### 🔌 A: Deploy do Backend (FastAPI)

1. Faça login no [render.com](https://render.com) e clique em **New > Web Service**.
2. Conecte o repositório Git do seu projeto.
3. Nas configurações do Web Service:
   * **Name**: `auracv-backend` (ou o nome de sua escolha)
   * **Root Directory**: `backend` (isso garante que o Render rode os comandos dentro da pasta do backend)
   * **Runtime**: `Docker` (Recomendado, o Render lerá automaticamente o `backend/Dockerfile`)
     * *Alternativa com Python nativo*: Runtime: `Python 3`, Build Command: `pip install -r requirements.txt`, Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Clique em **Advanced** para adicionar as seguintes **Environment Variables (Variáveis de Ambiente)**:
   
   | Nome da Variável | Valor | Descrição |
   | :--- | :--- | :--- |
   | `DATABASE_URL` | `postgresql://postgres.xxxxxx...` | A URL de conexão do seu banco Supabase. |
   | `GEMINI_API_KEY` | `AIzaSy...` | Sua chave de API do Gemini para as triagens reais de currículo. |
   | `PYTHONUNBUFFERED` | `1` | Mantém logs em tempo real do console. |

5. Clique em **Create Web Service**. O Render irá baixar o código, buildar a imagem Docker e expor a API de forma segura.

---

## 🎨 Passo 4: Conectar o Frontend ao Novo Backend

Quando o seu Backend terminar de subir no Render, ele terá uma URL pública, como:
`https://auracv-backend.onrender.com`

Você precisará atualizar o frontend para apontar para essa nova URL de produção em vez de `http://localhost:8000`.

### 📡 Como Atualizar no React

Vamos verificar onde as chamadas de API são feitas no seu frontend React e garantir que a URL da API seja dinâmica usando variáveis de ambiente do Vite (geralmente `VITE_API_URL` ou alterando as requisições para apontar dinamicamente para o backend).

No Vite, você pode criar um arquivo `frontend/.env.production` ou configurar diretamente na plataforma de hospedagem do Frontend (como Vercel, Netlify ou o próprio Render Static Site):

```env
VITE_API_URL=https://auracv-backend.onrender.com
```

### 📦 Deploy do Frontend no Render (Static Site)

1. No Render, clique em **New > Static Site**.
2. Conecte o mesmo repositório do Github.
3. Configure os detalhes do deploy:
   * **Name**: `auracv-frontend` (ou de sua escolha)
   * **Root Directory**: `frontend`
   * **Build Command**: `npm run build`
   * **Publish Directory**: `dist` (pasta padrão gerada pelo Vite)
4. Adicione a variável de ambiente nas configurações avançadas:
   * `VITE_API_URL` = `https://[SUA_URL_DO_BACKEND_NO_RENDER].onrender.com`
5. Clique em **Create Static Site**.

Pronto! Seu SaaS de Ranqueamento de CVs com IA estará 100% online, seguro e integrado com um banco de dados relacional de produção no Supabase.
