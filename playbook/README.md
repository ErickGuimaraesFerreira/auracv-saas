# AuraCV 🚀 | SaaS de Triagem e Ranqueamento de Currículos com IA

**AuraCV** é uma plataforma SaaS premium e moderna de co-piloto para recrutadores (ATS Co-Pilot) alimentada por Inteligência Artificial. A plataforma permite cadastrar vagas com requisitos específicos, fazer upload de múltiplos currículos (PDF/DOCX) simultaneamente, extrair texto brutos e ranquear candidatos em tempo real baseado em um score semântico de aderência técnica calculado por modelos de linguagem (LLM).

O sistema foi estruturado para ser robusto, visualmente impactante, ágil e extremamente simples de integrar com qualquer ATS de mercado.

---

## 🛠️ Stacks Utilizadas

### **Backend**
*   **FastAPI (Python 3.12+):** Framework assíncrono de alto desempenho.
*   **SQLModel / SQLAlchemy:** Abstração e modelagem de banco de dados robusto.
*   **SQLite:** Banco de dados local em arquivo único (zero setup inicial).
*   **PyPDF / python-docx:** Extração e parsing de texto limpo em currículos digitais.
*   **Google Gemini (Gemini 2.5 Flash / 1.5 Flash):** Análise semântica avançada com saída estruturada via JSON Schema.

### **Frontend**
*   **React + Vite:** Construção rápida e build ultra otimizado.
*   **CSS Custom System (Glassmorphic Dark Design):** Visual premium estilo cockpit com micro-animações de triagem, radares de progresso e interfaces fluidas.
*   **Lucide Icons:** Ícones modernos e limpos.

---

## 🚀 Como Executar o Projeto

Você pode iniciar o projeto de duas formas extremamente simples: usando **Docker Compose** (produção/empacotado) ou rodando os servidores **Locais** em modo desenvolvedor.

### **Método 1: Rodando com Docker Compose (Recomendado)**
Certifique-se de possuir o Docker e Docker Compose instalados em sua máquina. No terminal, na raiz do projeto, execute:

```bash
docker-compose up --build
```

Isso fará o build otimizado de ambos os serviços:
*   O **Backend** estará disponível em: `http://localhost:8080`
*   O **Frontend** (Nginx) estará disponível no padrão HTTP em: `http://localhost`

---

### **Método 2: Rodando Localmente (Modo Desenvolvedor)**

Caso queira rodar o frontend e o backend em terminais separados para debugar o código em tempo real:

#### **Passo 1: Iniciar o Backend (FastAPI)**
1.  Navegue até a pasta `backend/`:
    ```bash
    cd backend
    ```
2.  Crie e ative seu ambiente virtual (caso já não esteja ativado):
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```
3.  Instale as dependências:
    ```bash
    pip install -r requirements.txt
    ```
4.  Inicie o servidor Uvicorn:
    ```bash
    uvicorn main:app --port 8080 --reload
    ```
    *A API estará ativa em `http://localhost:8080` com documentação interativa Swagger Swagger UI disponível em `http://localhost:8080/docs`.*

#### **Passo 2: Iniciar o Frontend (React + Vite)**
1.  Em outro terminal, acesse a pasta `frontend/`:
    ```bash
    cd frontend
    ```
2.  Instale os pacotes npm:
    ```bash
    npm install
    ```
3.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
    *O painel estará rodando em `http://localhost:5173`.*

---

## 🧠 Ativando a Inteligência Artificial (Google Gemini API)

A plataforma possui um **Mock Mode integrado**. Se você rodar a aplicação sem configurar nenhuma chave de API, ela funcionará normalmente! Nosso backend possui algoritmos de correspondência de palavras-chave inteligentes que simulam análises perfeitas do Gemini, permitindo testar a experiência visual e fluxo da aplicação imediatamente.

Para ativar a inteligência real do Gemini 2.5 Flash:
1.  Crie ou obtenha sua chave de API no [Google AI Studio](https://aistudio.google.com/).
2.  Abra o arquivo `backend/.env`.
3.  Adicione a sua chave na variável:
    ```env
    GEMINI_API_KEY=sua_chave_aqui
    ```
4.  Reinicie o servidor backend. O sistema detectará automaticamente a chave e fará as triagens reais baseadas no currículo enviado!

---

## 🔗 Integração ATS (Fácil de Conectar)

A plataforma conta com uma **Aba de Integração** com exemplos prontos de requisições. 
Para integrar o motor AuraCV a qualquer formulário ou sistema de Recrutamento externo (Gupy, Greenhouse, etc.), basta que a plataforma externa faça uma requisição POST enviando o currículo como arquivo multipart para o nosso endpoint:

```bash
curl -X POST "http://localhost:8080/api/vagas/{vaga_id}/upload" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "files=@/caminho/do/seu/curriculo.pdf"
```

O retorno será o ranking de currículos completo, estruturado e reordenado automaticamente!
