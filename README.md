# AuraCV - Triagem Inteligente de Currículos (SaaS)

Sistema moderno de recrutamento (ATS) que automatiza a triagem e o ranqueamento de currículos utilizando Inteligência Artificial (Gemini AI). Focado em economizar até 80% do tempo do departamento de Recursos Humanos através de avaliações semânticas de alta precisão.

## 🚀 Funcionalidades

- **Portal Público de Candidatos**: Interface clean e responsiva para que candidatos anexem seus currículos (PDF/DOCX) rapidamente.
- **Painel de Recrutador (RH)**: Gestão completa de vagas, requisitos obrigatórios e desejáveis.
- **Triagem com Inteligência Artificial**: Extração de dados (Parser) e análise semântica automática cruzando as habilidades do candidato com as exigências da vaga.
- **Dashboard e Ranking**: Visão imediata dos candidatos com maior fit cultural e técnico para a vaga, incluindo Pontos Fortes, Gaps e a justificativa gerada pela IA.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React, Vite, CSS Vanilla (Design Moderno & Glassmorphism)
- **Backend**: Python, FastAPI, SQLModel, SQLAlchemy
- **Banco de Dados**: PostgreSQL (Supabase) / SQLite (Fallback local)
- **IA**: Google Gemini Pro/Flash APIs
- **Infraestrutura**: Docker, Render

## ⚙️ Como Executar Localmente

**1. Clone o repositório:**
```bash
git clone https://github.com/ErickGuimaraesFerreira/auracv-saas.git
cd auracv-saas
```

**2. Suba o ambiente via Docker Compose:**
```bash
docker-compose up --build
```
- O Frontend ficará disponível em: `http://localhost:80`
- O Backend (API) ficará disponível em: `http://localhost:8080`

*(Alternativamente, você pode rodar os serviços separadamente acessando as pastas `/frontend` com `npm run dev` e `/backend` ativando o `.venv` e rodando `uvicorn main:app --reload`)*.

## 🛡️ Segurança (DevSecOps)

- Rotas de API protegidas por CORS estrito (`FRONTEND_URL`).
- Prevenção de ataques DoS de disco por limites de streaming (Chunks) de até 10MB no upload.
- Gerenciamento de credenciais via variáveis de ambiente segregadas (`.env`).

---
*Desenvolvido com foco em escalabilidade, performance e excelente Experiência do Usuário (UX).*
