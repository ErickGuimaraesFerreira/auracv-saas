import os
import sqlite3
import json
from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine, Session, select
from models import Vaga, Candidato, AnaliseCV

# Carrega variáveis de ambiente
load_dotenv()

# Caminho do SQLite local
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SQLITE_PATH = os.path.join(BASE_DIR, "cv_ranking.db")

# URL do PostgreSQL/Supabase
DATABASE_URL = os.getenv("DATABASE_URL")

def convert_postgres_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url

def migrate():
    if not os.path.exists(SQLITE_PATH):
        print(f"[-] Arquivo SQLite local não encontrado em: {SQLITE_PATH}")
        print("[*] Nada para migrar do banco local.")
        return

    if not DATABASE_URL:
        print("[-] Erro: DATABASE_URL não está configurada no arquivo .env!")
        print("[*] Por favor, adicione a string de conexão do Supabase ao arquivo .env no backend e tente novamente.")
        return

    dest_url = convert_postgres_url(DATABASE_URL)
    print(f"[*] Iniciando migração do SQLite local para o Supabase (PostgreSQL)...")

    # Conecta no SQLite local
    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()

    # Conecta no PostgreSQL / Supabase
    pg_engine = create_engine(dest_url)
    
    # Garante que as tabelas existem no Supabase
    print("[*] Verificando/Criando tabelas no Supabase...")
    SQLModel.metadata.create_all(pg_engine)

    with Session(pg_engine) as pg_session:
        # 1. Migrar Vagas
        print("[*] Migrando vagas...")
        sqlite_cursor.execute("SELECT * FROM vaga")
        sqlite_vagas = sqlite_cursor.fetchall()
        
        vagas_migradas = 0
        vaga_id_mapping = {} # SQLite ID -> Supabase ID
        
        for sv in sqlite_vagas:
            # Verifica se já existe vaga com mesmo título e descrição no Supabase para evitar duplicados
            existing_vaga = pg_session.exec(
                select(Vaga).where(Vaga.titulo == sv["titulo"], Vaga.descricao == sv["descricao"])
            ).first()
            
            if not existing_vaga:
                nova_vaga = Vaga(
                    titulo=sv["titulo"],
                    departamento=sv["departamento"],
                    descricao=sv["descricao"],
                    requisitos_obrigatorios=sv["requisitos_obrigatorios"],
                    requisitos_desejaveis=sv["requisitos_desejaveis"]
                )
                pg_session.add(nova_vaga)
                pg_session.commit()
                pg_session.refresh(nova_vaga)
                vaga_id_mapping[sv["id"]] = nova_vaga.id
                vagas_migradas += 1
            else:
                vaga_id_mapping[sv["id"]] = existing_vaga.id
                print(f"    [~] Vaga '{sv['titulo']}' já existe no Supabase. Mapeando ID existente.")
        
        print(f"[+] {vagas_migradas} vagas migradas com sucesso.")

        # 2. Migrar Candidatos
        print("[*] Migrando candidatos...")
        sqlite_cursor.execute("SELECT * FROM candidato")
        sqlite_candidatos = sqlite_cursor.fetchall()
        
        candidatos_migrados = 0
        candidato_id_mapping = {} # SQLite ID -> Supabase ID
        
        for sc in sqlite_candidatos:
            # Verifica se já existe candidato com mesmo email no Supabase
            existing_cand = pg_session.exec(
                select(Candidato).where(Candidato.email == sc["email"])
            ).first()
            
            if not existing_cand:
                novo_cand = Candidato(
                    nome=sc["nome"],
                    email=sc["email"],
                    telefone=sc["telefone"],
                    linkedin_url=sc["linkedin_url"]
                )
                pg_session.add(novo_cand)
                pg_session.commit()
                pg_session.refresh(novo_cand)
                candidato_id_mapping[sc["id"]] = novo_cand.id
                candidatos_migrados += 1
            else:
                candidato_id_mapping[sc["id"]] = existing_cand.id
                print(f"    [~] Candidato com email '{sc['email']}' já existe. Mapeando ID existente.")

        print(f"[+] {candidatos_migrados} candidatos migrados com sucesso.")

        # 3. Migrar Análises de CV
        print("[*] Migrando análises de CV...")
        sqlite_cursor.execute("SELECT * FROM analisecv")
        sqlite_analises = sqlite_cursor.fetchall()
        
        analises_migradas = 0
        
        for sa in sqlite_analises:
            # Mapeia os novos IDs
            new_vaga_id = vaga_id_mapping.get(sa["vaga_id"])
            new_candidato_id = candidato_id_mapping.get(sa["candidato_id"])
            
            if not new_vaga_id or not new_candidato_id:
                print(f"    [-] Pulando análise ID {sa['id']}: Vaga ou Candidato correspondente não pôde ser mapeado.")
                continue
                
            # Verifica se já existe esta análise
            existing_analise = pg_session.exec(
                select(AnaliseCV).where(
                    AnaliseCV.vaga_id == new_vaga_id,
                    AnaliseCV.candidato_id == new_candidato_id,
                    AnaliseCV.score_geral == sa["score_geral"]
                )
            ).first()
            
            if not existing_analise:
                nova_analise = AnaliseCV(
                    vaga_id=new_vaga_id,
                    candidato_id=new_candidato_id,
                    score_geral=sa["score_geral"],
                    habilidades_encontradas=sa["habilidades_encontradas"],
                    habilidades_faltantes=sa["habilidades_faltantes"],
                    justificativa_fit=sa["justificativa_fit"],
                    pontos_fortes=sa["pontos_fortes"],
                    pontos_atencao=sa["pontos_atencao"],
                    resumo_experiencia=sa["resumo_experiencia"],
                    status=sa["status"],
                    caminho_arquivo=sa["caminho_arquivo"]
                )
                pg_session.add(nova_analise)
                analises_migradas += 1
            else:
                print(f"    [~] Análise correspondente à vaga {new_vaga_id} e candidato {new_candidato_id} já existe.")

        pg_session.commit()
        print(f"[+] {analises_migradas} análises de CV migradas com sucesso.")

    sqlite_conn.close()
    print("[+] Processo de migração concluído com sucesso!")

if __name__ == "__main__":
    migrate()
