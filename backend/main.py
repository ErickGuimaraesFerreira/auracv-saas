import os
import json
import uuid
import shutil
from typing import List
from fastapi import FastAPI, Depends, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from datetime import datetime

from database import init_db, get_session
from models import (
    Vaga, VagaCreate, VagaRead,
    Candidato, CandidatoCreate,
    AnaliseCV, AnaliseCVRead, RankingItem
)
from parser import parse_resume
from ai_service import analyze_resume_with_gemini

app = FastAPI(
    title="Resume AI Screener & Ranker API",
    description="API de triagem automatizada de currículos integrada com Gemini AI",
    version="1.0.0"
)

# Configuração de CORS com segurança DevSecOps
# Em produção, defina a variável de ambiente FRONTEND_URL. Se não definida, permite ambiente local.
allowed_origins = os.getenv("FRONTEND_URL", "http://localhost,http://localhost:5173,http://localhost:3000,http://localhost:80").split(",")
is_wildcard = allowed_origins == ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=not is_wildcard, # allow_credentials e allow_origins=['*'] não podem ser usados juntos
    allow_methods=["*"],
    allow_headers=["*"],
)

# Diretório para salvar arquivos de currículo
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.on_event("startup")
def on_startup():
    """Executado na inicialização da API. Cria as tabelas do banco de dados."""
    init_db()

@app.get("/")
def read_root():
    """Rota raiz para teste de saúde (health check) do Render."""
    return {"status": "healthy", "service": "Resume AI Screener API"}

# --- ROTAS DE VAGAS ---

@app.post("/api/vagas", response_model=VagaRead, status_code=status.HTTP_201_CREATED)
def create_vaga(vaga: VagaCreate, session: Session = Depends(get_session)):
    """Cria uma nova vaga no banco de dados com seus requisitos específicos."""
    db_vaga = Vaga.from_orm(vaga)
    session.add(db_vaga)
    session.commit()
    session.refresh(db_vaga)
    v_dict = db_vaga.dict()
    v_dict["candidatos_count"] = 0
    return v_dict

@app.get("/api/vagas", response_model=List[VagaRead])
def list_vagas(session: Session = Depends(get_session)):
    """Lista todas as vagas cadastradas no sistema com a contagem de inscritos."""
    vagas = session.exec(select(Vaga)).all()
    result = []
    for v in vagas:
        v_dict = v.dict()
        v_dict["candidatos_count"] = len(v.analises)
        result.append(v_dict)
    return result

@app.get("/api/vagas/{vaga_id}", response_model=VagaRead)
def get_vaga(vaga_id: int, session: Session = Depends(get_session)):
    """Busca detalhes de uma vaga específica."""
    vaga = session.get(Vaga, vaga_id)
    if not vaga:
        raise HTTPException(status_code=404, detail="Vaga não encontrada")
    v_dict = vaga.dict()
    v_dict["candidatos_count"] = len(vaga.analises)
    return v_dict

@app.delete("/api/vagas/{vaga_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vaga(vaga_id: int, session: Session = Depends(get_session)):
    """Exclui uma vaga e todas as análises/candidatos relacionados (Cascade)."""
    vaga = session.get(Vaga, vaga_id)
    if not vaga:
        raise HTTPException(status_code=404, detail="Vaga não encontrada")
    session.delete(vaga)
    session.commit()
    return None


# --- PROCESSAMENTO E EXTRAÇÃO DE CVs ---

@app.post("/api/vagas/{vaga_id}/upload", response_model=List[RankingItem])
def upload_resumes(
    vaga_id: int,
    files: List[UploadFile] = File(...),
    session: Session = Depends(get_session)
):
    """Recebe múltiplos arquivos de currículo (PDF/DOCX), extrai os dados via parser,
    analisa com a inteligência artificial da Gemini e salva candidato, análise e score.
    Retorna o ranking atualizado da vaga."""
    
    # 1. Verifica se a vaga existe
    vaga = session.get(Vaga, vaga_id)
    if not vaga:
        raise HTTPException(status_code=404, detail="Vaga não encontrada")
        
    resultados = []
    
    for file in files:
        # Verifica extensão suportada
        _, ext = os.path.splitext(file.filename.lower())
        if ext not in [".pdf", ".docx", ".doc", ".txt"]:
            continue
            
        # 2. Verifica tamanho (Max 10MB para evitar DoS) e salva no disco local com nome único seguro
        file_id = str(uuid.uuid4())
        safe_filename = f"{file_id}{ext}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        
        try:
            MAX_FILE_SIZE = 10 * 1024 * 1024 # 10 Megabytes
            size = 0
            with open(file_path, "wb") as buffer:
                while chunk := file.file.read(8192): # Lê o arquivo em pedaços (chunks) seguros de memória
                    size += len(chunk)
                    if size > MAX_FILE_SIZE:
                        raise ValueError("O currículo excede o limite de segurança de 10MB.")
                    buffer.write(chunk)
        except ValueError as e:
            if os.path.exists(file_path):
                os.remove(file_path)
            continue # Ignora este arquivo malicioso/gigante e passa para o próximo
        except Exception as e:
            continue  # Se falhar em um arquivo, continua com os outros
            
        # 3. Extrai texto bruto do arquivo
        try:
            extracted_text = parse_resume(file_path)
            if not extracted_text:
                raise ValueError("Nenhum texto extraído do currículo.")
        except Exception as e:
            if os.path.exists(file_path):
                os.remove(file_path)
            continue
            
        # 4. Executa análise de IA (Gemini ou Mock)
        try:
            analysis_result = analyze_resume_with_gemini(
                cv_text=extracted_text,
                vaga_titulo=vaga.titulo,
                vaga_descricao=vaga.descricao,
                req_obrigatorios=vaga.requisitos_obrigatorios,
                req_desejaveis=vaga.requisitos_desejaveis
            )
        except Exception as e:
            if os.path.exists(file_path):
                os.remove(file_path)
            continue
            
        # 5. Salva ou atualiza Candidato baseado no email
        email = analysis_result.get("email", "sem-email@candidato.com").lower()
        candidato = session.exec(select(Candidato).where(Candidato.email == email)).first()
        
        if not candidato:
            candidato = Candidato(
                nome=analysis_result.get("nome_candidato", "Candidato Extraído"),
                email=email,
                telefone=analysis_result.get("telefone"),
                linkedin_url=analysis_result.get("linkedin")
            )
            session.add(candidato)
            session.commit()
            session.refresh(candidato)
        else:
            # Atualiza dados se mudaram
            candidato.nome = analysis_result.get("nome_candidato", candidato.nome)
            candidato.telefone = analysis_result.get("telefone", candidato.telefone)
            candidato.linkedin_url = analysis_result.get("linkedin", candidato.linkedin_url)
            session.add(candidato)
            session.commit()
            session.refresh(candidato)
            
        # 6. Salva o registro da Análise de CV
        # Como o SQLite não guarda listas, codificamos listas em strings JSON
        analise = AnaliseCV(
            vaga_id=vaga.id,
            candidato_id=candidato.id,
            score_geral=analysis_result.get("score_geral", 0.0),
            habilidades_encontradas=json.dumps(analysis_result.get("habilidades_encontradas", [])),
            habilidades_faltantes=json.dumps(analysis_result.get("habilidades_faltantes", [])),
            justificativa_fit=analysis_result.get("justificativa_fit", ""),
            pontos_fortes=json.dumps(analysis_result.get("pontos_fortes", [])),
            pontos_atencao=json.dumps(analysis_result.get("pontos_atencao", [])),
            resumo_experiencia=analysis_result.get("resumo_experiencia", ""),
            status="concluido",
            caminho_arquivo=file_path
        )
        session.add(analise)
        session.commit()
        session.refresh(analise)
        
    # Retorna o ranking atualizado da vaga após processamento
    return get_vaga_ranking(vaga_id, session)


# --- ROTAS DE RANKING E ANÁLISES ---

@app.get("/api/vagas/{vaga_id}/ranking", response_model=List[RankingItem])
def get_vaga_ranking(vaga_id: int, session: Session = Depends(get_session)):
    """Retorna o ranking de currículos triados para uma vaga, ordenado do maior score para o menor."""
    vaga = session.get(Vaga, vaga_id)
    if not vaga:
        raise HTTPException(status_code=404, detail="Vaga não encontrada")
        
    # Busca todas as análises da vaga ordenadas por score de forma decrescente
    analises = session.exec(
        select(AnaliseCV)
        .where(AnaliseCV.vaga_id == vaga_id)
        .order_by(AnaliseCV.score_geral.desc())
    ).all()
    
    ranking = []
    for a in analises:
        c = session.get(Candidato, a.candidato_id)
        if not c:
            continue
            
        # Reconstrói as listas de string JSON para arrays Python
        ranking.append(
            RankingItem(
                analise_id=a.id,
                candidato_nome=c.nome,
                candidato_email=c.email,
                candidato_telefone=c.telefone,
                candidato_linkedin=c.linkedin_url,
                score_geral=a.score_geral,
                habilidades_encontradas=json.loads(a.habilidades_encontradas),
                habilidades_faltantes=json.loads(a.habilidades_faltantes),
                justificativa_fit=a.justificativa_fit,
                pontos_fortes=json.loads(a.pontos_fortes),
                pontos_atencao=json.loads(a.pontos_atencao),
                resumo_experiencia=a.resumo_experiencia,
                status=a.status,
                data_analise=a.data_analise,
                caminho_arquivo=a.caminho_arquivo
            )
        )
        
    return ranking

@app.delete("/api/analises/{analise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_analise(analise_id: int, session: Session = Depends(get_session)):
    """Deleta um currículo específico triado, removendo o registro da análise e o arquivo físico."""
    analise = session.get(AnaliseCV, analise_id)
    if not analise:
        raise HTTPException(status_code=404, detail="Análise não encontrada")
        
    # Remove arquivo físico se existir
    if analise.caminho_arquivo and os.path.exists(analise.caminho_arquivo):
        try:
            os.remove(analise.caminho_arquivo)
        except Exception:
            pass
            
    session.delete(analise)
    session.commit()
    return None
