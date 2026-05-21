from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class VagaBase(SQLModel):
    titulo: str
    departamento: Optional[str] = None
    descricao: str
    requisitos_obrigatorios: str  # Armazenado como string separada por vírgula ou JSON
    requisitos_desejaveis: str    # Armazenado como string separada por vírgula ou JSON

class Vaga(VagaBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    data_criacao: datetime = Field(default_factory=datetime.utcnow)
    
    # Relacionamentos
    analises: List["AnaliseCV"] = Relationship(back_populates="vaga", cascade_delete=True)

class VagaCreate(VagaBase):
    pass

class VagaRead(VagaBase):
    id: int
    data_criacao: datetime
    candidatos_count: int = 0


class CandidatoBase(SQLModel):
    nome: str
    email: str
    telefone: Optional[str] = None
    linkedin_url: Optional[str] = None

class Candidato(CandidatoBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Relacionamentos
    analises: List["AnaliseCV"] = Relationship(back_populates="candidato", cascade_delete=True)

class CandidatoCreate(CandidatoBase):
    pass

class CandidatoRead(CandidatoBase):
    id: int


class AnaliseCVBase(SQLModel):
    vaga_id: int = Field(foreign_key="vaga.id")
    candidato_id: int = Field(foreign_key="candidato.id")
    score_geral: float = 0.0
    habilidades_encontradas: str = "[]"  # JSON String
    habilidades_faltantes: str = "[]"    # JSON String
    justificativa_fit: str = ""
    pontos_fortes: str = "[]"            # JSON String
    pontos_atencao: str = "[]"           # JSON String
    resumo_experiencia: str = ""
    status: str = "pendente"             # "pendente", "processando", "concluido", "falhou"
    caminho_arquivo: str

class AnaliseCV(AnaliseCVBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    data_analise: datetime = Field(default_factory=datetime.utcnow)
    
    # Relacionamentos
    vaga: Vaga = Relationship(back_populates="analises")
    candidato: Candidato = Relationship(back_populates="analises")

class AnaliseCVRead(AnaliseCVBase):
    id: int
    data_analise: datetime
    candidato: Optional[CandidatoRead] = None


# Schema de resposta rico para o Ranking (D&D e visualização)
class RankingItem(SQLModel):
    analise_id: int
    candidato_nome: str
    candidato_email: str
    candidato_telefone: Optional[str] = None
    candidato_linkedin: Optional[str] = None
    score_geral: float
    habilidades_encontradas: List[str]
    habilidades_faltantes: List[str]
    justificativa_fit: str
    pontos_fortes: List[str]
    pontos_atencao: List[str]
    resumo_experiencia: str
    status: str
    data_analise: datetime
    caminho_arquivo: str
