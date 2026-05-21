# Relatório de Auditoria DevSecOps e Code Review

### [ALTA] - [FastAPI: Misconfiguration CORS / backend/main.py]
- **Descrição Técnica:** O middleware CORS do FastAPI está configurado para aceitar requisições de qualquer origem (`allow_origins=["*"]`). Além disso, `allow_credentials=True` com origens abertas pode causar conflitos severos em navegadores modernos e expor completamente os endpoints privados (como criação de vagas e exclusão de análises) para ataques de Cross-Site Request Forgery (CSRF) via interfaces maliciosas hospedadas em domínios de terceiros.
- **Cenário de Ataque:** Um atacante pode criar um site falso. Quando o recrutador logado (ou que possua cookies de sessão/cache) acessa esse site falso, um script JavaScript malicioso em segundo plano faz requisições invisíveis para `http://localhost:8080/api/vagas`, deletando vagas ou injetando perfis fraudulentos através da permissividade do CORS.
- **Código/Configuração Vulnerável:**
```python
# backend/main.py (Linha 27)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
- **Remediação Corrigida:**
```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://carreiras.unisoma.com" # Substituir pelo domínio oficial do frontend em PRD
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

### [ALTA] - [Docker & Infraestrutura: Execução como Root / backend/Dockerfile]
- **Descrição Técnica:** O Dockerfile do backend baseia-se em `python:3.12-slim` mas não define um usuário sem privilégios (`USER`). O container roda como usuário `root` por padrão. Isso quebra o princípio primário de hardening de containers do menor privilégio.
- **Cenário de Ataque:** Caso o atacante consiga explorar uma falha de RCE (Remote Code Execution) através do processamento de um PDF/DOCX malicioso pela biblioteca de parsing ou vulnerabilidade de dependência, o processo comprometido terá poderes totais de `root` dentro do container, facilitando substancialmente o *container breakout* para a máquina host.
- **Código/Configuração Vulnerável:**
```dockerfile
# backend/Dockerfile
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app
# ... dependências ...
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```
- **Remediação Corrigida:**
```dockerfile
# backend/Dockerfile
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Cria grupo e usuário sem privilégios para mitigar escalonamento
RUN addgroup --system appgroup && adduser --system --group appuser

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt
COPY . .

# Altera a permissão da pasta antes da troca de contexto para viabilizar DB/uploads
RUN chown -R appuser:appgroup /app

# Transição para usuário seguro (Non-Root)
USER appuser

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### [MÉDIA] - [FastAPI & LLM: Falta de Limitação de Payload (DoS & Prompt Injection) / backend/main.py]
- **Descrição Técnica:** O endpoint de upload `/api/vagas/{vaga_id}/upload` repassa o texto extraído cru (`cv_text`) para a API do Gemini via `ai_service.py` sem validar estritamente o tamanho máximo do arquivo de origem (em bytes) ou truncar o total de tokens processados para a LLM.
- **Cenário de Ataque:** Atacantes podem submeter arquivos PDFs malformados ("PDF zip bombs") com milhões de caracteres injetados. O `PdfReader` consumirá toda a RAM do servidor e o prompt do `ai_service.py` estourará o *context window* do Gemini (rate limit ou custos inesperados na API), gerando um autêntico Denial of Service (DoS).
- **Código/Configuração Vulnerável:**
```python
# backend/main.py (Linha 127)
        try:
            extracted_text = parse_resume(file_path)
            if not extracted_text:
                raise ValueError("Nenhum texto extraído do currículo.")
```
- **Remediação Corrigida:**
```python
# backend/main.py
        # 1. Definir tamanho máximo rígido na leitura de cada arquivo para mitigar Zip Bombs
        MAX_FILE_SIZE = 5 * 1024 * 1024  # Limite de 5MB
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        if file_size > MAX_FILE_SIZE:
             continue # Rejeita silenciosamente arquivos que estouram o limite
             
        # [...] Processamento
        try:
            extracted_text = parse_resume(file_path)
            if not extracted_text:
                raise ValueError("Nenhum texto extraído.")
            
            # 2. Defesa contra Prompt Injection / Context Overflow
            # Trunca o texto em 15.000 caracteres (aprox. 3k-4k tokens) para garantir segurança semântica da API
            extracted_text = extracted_text[:15000] 
```

### [BAIXA] - [Databases: Avaliação de Injeção no ORM / backend/models.py]
- **Descrição Técnica:** A auditoria do código confirmou que as interações com o SQLite utilizam o ORM (SQLModel + SQLAlchemy). O design das queries em `main.py` não realiza concatenação de strings inseguras (utiliza `select().where()`).
- **Status da Validação:** **✅ SEGURO**. Nenhuma vulnerabilidade de Injeção de SQL ou raw queries encontrada no fluxo das vagas ou candidatos.

### [BAIXA] - [Frontend React: Avaliação de Injeção de DOM-XSS / frontend/src/]
- **Descrição Técnica:** Realizada auditoria profunda para validar se a interface em React renderiza a resposta da IA (como o JSON das análises e justificativas) de forma imprudente através de `dangerouslySetInnerHTML`. 
- **Status da Validação:** **✅ SEGURO**. Todo o código frontend injeta os valores recebidos da API usando chaves normais do JSX (`{candidate.justificativa_fit}` e afins), delegando ao React o escape de HTML de forma 100% segura. O painel está blindado contra XSS derivado da API.
