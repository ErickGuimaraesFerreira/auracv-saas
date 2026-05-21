# Plano de Implementação: SaaS de Triagem e Ranqueamento de CVs (AI-Powered)

Este documento descreve a arquitetura, a stack tecnológica sugerida e o plano de desenvolvimento para o **SaaS de Triagem e Ranqueamento de Currículos**. A solução foi desenhada para ser moderna, extremamente rápida, visualmente deslumbrante e simples de integrar com qualquer ATS (Applicant Tracking System).

---

## 🚀 1. Stack Tecnológica Sugerida

Para garantir alta performance, facilidade de manutenção, processamento eficiente de linguagem natural (LLM) e uma experiência de usuário (UX) de nível mundial, propomos a seguinte stack:

### **Backend (Core de IA e Parsing)**
- **Linguagem:** **Python 3.11+** (padrão de mercado para IA e manipulação de arquivos).
- **Framework Web:** **FastAPI**
  - Assíncrono por padrão, extremamente rápido (desempenho comparável a Go e Node.js).
  - Documentação OpenAPI (Swagger) gerada automaticamente (essencial para integração fácil com ATS).
  - Validação de tipos robusta usando Pydantic.
- **Processamento de Currículos:**
  - `pypdf` para extração rápida e leve de texto de PDFs.
  - `python-docx` para ler arquivos Word (.docx).
- **Inteligência Artificial & LLM:**
  - **Gemini 2.5 Flash** (via SDK oficial do Google).
  - *Por que Gemini?* Janela de contexto massiva, velocidade incomparável, custo extremamente baixo e excelente suporte para estruturar saídas JSON complexas via schemas nativos.
- **Banco de Dados & ORM:**
  - **SQLModel** (combina SQLAlchemy e Pydantic para a melhor experiência de desenvolvedor em Python).
  - **SQLite** para ambiente de desenvolvimento local (rápido, arquivo único, sem necessidade de setup de servidor). Facilmente migrável para **PostgreSQL** para produção.

### **Frontend (Interface do Usuário Premium)**
- **Framework:** **React + Vite** (rápido, SPA fluida, build quase instantâneo).
- **Estilização:** **Tailwind CSS + Vanilla CSS** (para efeitos avançados de glassmorphism, gradientes modernos e micro-animações).
- **Ícones:**
  - `lucide-react` para ícones modernos.
- **Componentes Principais:**
  - Dashboard de Métricas.
  - Kanban / Lista de Ranqueamento Interativa com pontuações dinâmicas e radares de habilidades.
  - Painel de Vagas (Criação de Requisitos).
  - Central de Integrações ATS (Exibição de credenciais de API, webhooks e exemplos de código curl/fetch).

---

## 🗄️ 2. Modelagem do Banco de Dados (Schema)

Estrutura simplificada e robusta para suportar o SaaS multi-inquilino e a triagem por vaga:

### Entidades Principais
1. **`Vaga` (Job Opening)**
   - `id` (UUID/Integer)
   - `titulo` (String)
   - `departamento` (String, opcional)
   - `descricao` (Text)
   - `requisitos_obrigatorios` (JSON/Text - ex: "Python, Inglês Avançado")
   - `requisitos_desejaveis` (JSON/Text - ex: "Docker, AWS")
   - `data_criacao` (DateTime)

2. **`Candidato` (Candidate Profile)**
   - `id` (UUID/Integer)
   - `nome` (String)
   - `email` (String)
   - `telefone` (String, opcional)
   - `linkedin_url` (String, opcional)

3. **`AnaliseCV` (Resume Analysis / Screening)**
   - `id` (UUID/Integer)
   - `vaga_id` (Fk para Vaga)
   - `candidato_id` (Fk para Candidato)
   - `score_geral` (Float, 0 a 100)
   - `habilidades_encontradas` (JSON/Text)
   - `habilidades_faltantes` (JSON/Text)
   - `justificativa_fit` (Text)
   - `pontos_fortes` (JSON/Text)
   - `pontos_atencao` (JSON/Text)
   - `resumo_experiencia` (Text)
   - `status` (Enum: "pendente", "processando", "concluido", "falhou")
   - `caminho_arquivo` (String - Caminho local/S3 do currículo)
   - `data_analise` (DateTime)

---

## 🧠 3. Estratégia de Análise com Inteligência Artificial (Gemini)

Para obter o ranqueamento mais preciso, a análise será realizada em duas etapas inteligentes:
1. **Parsing e Limpeza:** O backend extrai o texto bruto do PDF/Word.
2. **Avaliação Semântica Estruturada (Structured Output LLM):** Enviamos o texto do currículo e os requisitos da vaga para o Gemini 2.5 Flash. Usando a funcionalidade de resposta estruturada, instruímos o modelo a retornar exatamente o seguinte objeto:

```json
{
  "nome_candidato": "João da Silva",
  "email": "joao@email.com",
  "telefone": "(11) 99999-9999",
  "linkedin": "linkedin.com/in/joao",
  "score_geral": 87,
  "habilidades_encontradas": ["Python", "FastAPI", "SQL", "Git"],
  "habilidades_faltantes": ["Docker", "AWS"],
  "resumo_experiencia": "Desenvolvedor Backend com 3 anos de experiência focados em Python e criação de APIs RESTful...",
  "pontos_fortes": [
    "Experiência sólida com FastAPI em produção.",
    "Bons conhecimentos de SQL e otimização de queries."
  ],
  "pontos_atencao": [
    "Não possui experiência prévia documentada com Docker ou Kubernetes.",
    "Falta experiência direta com provedores de nuvem (AWS/GCP)."
  ],
  "justificativa_fit": "O candidato possui excelente fit técnico para as atividades cotidianas de desenvolvimento backend em Python e FastAPI. O score foi reduzido principalmente pela ausência de vivência com DevOps (Docker e Cloud), mas é facilmente treinável devido à sua sólida base em engenharia de software."
}
```

---

## 🔗 4. API de Integração ATS (Simples e Poderosa)

Para permitir que qualquer plataforma ATS externa envie currículos e consulte o ranqueamento automaticamente:

### **Endpoint 1: Criar uma Vaga e Obter o ID**
`POST /api/vagas`
*Payload:*
```json
{
  "titulo": "Desenvolvedor Python Backend Pleno",
  "descricao": "Responsável por criar APIs robustas em FastAPI...",
  "requisitos_obrigatorios": "Python, FastAPI, Bancos SQL",
  "requisitos_desejaveis": "Docker, AWS"
}
```

### **Endpoint 2: Enviar Currículo para uma Vaga**
`POST /api/vagas/{vaga_id}/candidatos`
*Multipart/Form-Data:*
- `file`: Arquivo do currículo (`.pdf`, `.docx`)

*Retorno Imediato:*
```json
{
  "analise_id": 1,
  "status": "processando",
  "mensagem": "Currículo recebido com sucesso e enviado para análise da IA."
}
```

### **Endpoint 3: Obter o Ranking da Vaga**
`GET /api/vagas/{vaga_id}/ranking`
*Retorna a lista de candidatos ordenados do maior `score_geral` para o menor, com a justificativa completa e metadados.*

---

## 🛠️ 5. Plano de Ação (Fases de Desenvolvimento - STATUS ATUAL)

### ✅ **Fase 1: Estrutura Base e Backend (API FastAPI + Banco de Dados + Parser de Arquivos)**
- [x] Inicialização do projeto.
- [x] Criação das rotas principais no FastAPI (Vagas, Candidatos, Análises).
- [x] Integração da biblioteca de leitura de PDF/Word.
- [x] Configuração do banco SQLite com SQLModel e geração automática do banco.

### ✅ **Fase 2: Conexão com Gemini API (O Cérebro do SaaS)**
- [x] Criação do serviço de inteligência artificial.
- [x] Desenvolvimento do prompt especializado em português do Brasil para extração e scoring.
- [x] Implementação de validação de schemas de resposta do LLM para evitar alucinações e erros de parsing de JSON.
- [x] Testes de triagem automatizada com arquivos reais de currículo.

### ✅ **Fase 3: Frontend Premium & Interativo (React + Vanilla CSS)**
- [x] Implementação de um design corporativo *light theme premium* (Ajustado para o padrão visual corporativo).
- [x] Criação do **Dashboard Principal**:
  - [x] Painel de gerenciamento de vagas.
  - [x] Dropzone animado de currículos (drag-and-drop de múltiplos arquivos).
  - [x] Tela de Ranqueamento: Visualização moderna em cartões expansíveis, com barras de progresso para a nota do candidato, badges de habilidades presentes/ausentes coloridos, e uma aba de justificação detalhada.
  - [x] Tela da **Central do Desenvolvedor / ATS**: Interface para documentação da API, simulador de requisições.

### ✅ **Fase 4: Empacotamento Docker e Integração Final**
- [x] Criação de `Dockerfile` para o Backend.
- [x] Criação de `Dockerfile` para o Frontend.
- [x] Criação de um `docker-compose.yml` unificando toda a aplicação.

### ✅ **Fase 5: Branding Corporativo e Auditoria de Segurança (Extras Concluídos)**
- [x] Adaptação da identidade visual para o branding **Nodfy** (Logo corporativa importada, cores institucionais vermelho/laranja e slogan "Soluções Inteligentes").
- [x] Adequação avançada de contraste (WCAG) das fontes e tags para componentes no tema claro.
- [x] Criação de um portal público responsivo de vagas para os candidatos ("Nodfy Carreiras").
- [x] Auditoria de Segurança estrita cobrindo mitigação de payload abusivo (DoS), execução segura de Docker, permissões CORS e validação de XSS, consolidada na documentação (`security_audit_report.md`).
- [x] **Rebranding completo para Nodfy:** Remoção de toda menção ao nome anterior ("UniSoma") em todos os componentes (`App.jsx`, `PortalCandidato.jsx`, `Login.jsx`, `index.css`).
- [x] **Refinamentos de UI/UX no Cabeçalho:** Slogan "Nodfy - Soluções Inteligentes" como elemento tipográfico principal com fonte suave (`400`, `0.85rem`), sem `uppercase`.
- [x] **Rodapé minimalista:** Badge de versão `ATS v1.0` removido do cabeçalho e movido para um rodapé discreto em letra miúda (`0.75rem`) com copyright dinâmico em ambos os portais (Admin e Candidato).
- [x] **Ajuste do e-mail do usuário logado:** Tamanho reduzido para `0.75rem` e peso suave (`500`) para harmonia visual com a barra de navegação.

### 🚀 **Fase 6: Migração para Supabase (Escalabilidade e Produção Global) - ROADMAP FUTURO**
- [ ] **Migração do Banco de Dados:** Substituir o SQLite integrado localmente por uma instância PostgreSQL totalmente gerenciada pelo Supabase.
- [ ] **Armazenamento de Curriculos (Storage):** Migrar os uploads de PDFs/DOCXs do disco rígido local (pasta `/uploads`) para os *Supabase Storage Buckets* (alta disponibilidade via CDN e segurança RLS).
- [ ] **Autenticação Completa (Auth):** Implementar **Supabase Auth** com OAuth (Google/Microsoft), políticas RLS e gerenciamento de permissões granulares (RH vs Candidato).
- [ ] **Eventos em Tempo Real (Realtime):** Implementar *WebSockets* do Supabase para atualizar a barra de progresso da IA na tela sem precisar de recarregamento (*push events*).
- [ ] **Edge Functions (Opcional):** Deslocar processamentos leves para borda (Edge) e utilizar Webhooks do Supabase para integrar com outros ATS.

### 🔒 **Fase 7: Fluxo de Implementação de Autenticação para o RH (Supabase Auth)**
- [x] **Passo 1: Setup na Plataforma do Supabase (Nuvem):**
  - [x] Criar projeto na nuvem Supabase e extrair `Project URL` e `anon key`.
  - [x] Habilitar o provedor de autenticação "Email/Password" nas configurações de Auth.
  - [x] Cadastrar o primeiro usuário recrutador administrador via painel do Supabase.
  - [x] Configurar **URL Configuration** do Supabase: `Site URL` → `http://localhost:5173` e `Redirect URLs` → `http://localhost:5173/**` para funcionar o fluxo de confirmação de e-mail em desenvolvimento.
- [x] **Passo 2: Configuração do Ambiente Local (Frontend):**
  - [x] Criar o arquivo `.env` na raiz do frontend com as credenciais `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
  - [x] Instalar o SDK oficial do Supabase: `npm install @supabase/supabase-js`.
- [x] **Passo 3: Desenvolvimento da Tela de Login (React):**
  - [x] Criar o componente `Login.jsx` com o design light corporativo premium correspondente à marca.
  - [x] Implementar a chamada `supabase.auth.signInWithPassword(...)` conectada ao formulário.
  - [x] Proteger o carregamento do `App.jsx` administrativo, exibindo-o apenas quando houver um token JWT ativo da sessão no localStorage.
  - [x] Mensagens de erro traduzidas e humanizadas (`Invalid login credentials`, `Email not confirmed`).
- [ ] **Passo 4: Blindagem das APIs de Serviço (FastAPI Backend):**
  - [ ] Implementar verificação de tokens JWT nas requisições privadas no backend `main.py` decodificando a assinatura pública do Supabase Auth.
  - [ ] Impedir requisições de API diretas sem o cabeçalho `Authorization: Bearer <token>`.

### 🚀 **Fase 8: Deploy de Produção no Render (Publicação Global)**
- [ ] **Passo 1: Preparação da Infraestrutura no Render:**
  - [ ] Criar conta no Render (render.com) e vincular a conta do GitHub onde o repositório do projeto está hospedado.
- [ ] **Passo 2: Publicação do Frontend (Vite React):**
  - [ ] Criar um novo serviço do tipo **Static Site** apontando para o diretório `/frontend`.
  - [ ] Configurar o comando de Build como `npm run build` e o diretório de publicação (Publish Directory) como `dist`.
  - [ ] Adicionar a variável de ambiente pública `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no painel do Render.
- [ ] **Passo 3: Publicação do Backend (FastAPI Docker):**
  - [ ] Criar um novo serviço do tipo **Web Service** apontando para o diretório `/backend`.
  - [ ] Selecionar a opção de Build por **Docker** (o Render detectará o `Dockerfile` automaticamente).
  - [ ] Configurar as variáveis de ambiente sensíveis e seguras no painel do Render (`GEMINI_API_KEY`, dados do Supabase e configurações de CORS permitindo apenas o domínio gerado no Passo 2).
- [ ] **Passo 4: Homologação Final:**
  - [ ] Validar a triagem e ranqueamento de currículos enviados por candidatos reais diretamente pelo link público do "Nodfy Carreiras" hospedado no Render.
  - [ ] Certificar que o banco do Supabase e o painel administrativo do RH estão respondendo de forma segura, rápida e persistente.
  - [ ] **Atualizar URL Configuration no Supabase** para o domínio de produção: `Site URL` → `https://nodfy-cv.onrender.com` e `Redirect URLs` → `https://nodfy-cv.onrender.com/**` (remover entradas localhost).
