import os
from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine, Session

# Carrega variáveis de ambiente do arquivo .env
load_dotenv()

# Obtém a URL do banco de dados do ambiente ou usa o SQLite local como fallback
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    DATABASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATABASE_PATH = os.path.join(DATABASE_DIR, "cv_ranking.db")
    DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# SQLAlchemy/SQLModel exige "postgresql://" em vez de "postgres://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Configurações de conexão específicas por banco
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    # Necessário para evitar erros de concorrência com SQLite local no FastAPI
    connect_args = {"check_same_thread": False}

# Cria o engine de banco de dados
engine = create_engine(DATABASE_URL, connect_args=connect_args)

def init_db():
    """Inicializa as tabelas no banco de dados se não existirem."""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Injeta a sessão do banco de dados nas rotas do FastAPI."""
    with Session(engine) as session:
        yield session

