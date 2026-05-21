-- Schema de Banco de Dados para o Supabase (PostgreSQL)
-- Ranqueamento de CVs - IA Screener & Ranker

-- Tabela de Vagas
CREATE TABLE IF NOT EXISTS vaga (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    departamento VARCHAR(255),
    descricao TEXT NOT NULL,
    requisitos_obrigatorios TEXT NOT NULL,
    requisitos_desejaveis TEXT NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Tabela de Candidatos
CREATE TABLE IF NOT EXISTS candidato (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(50),
    linkedin_url VARCHAR(500)
);

-- Tabela de Analises de CV (Relaciona Vaga e Candidato)
CREATE TABLE IF NOT EXISTS analisecv (
    id SERIAL PRIMARY KEY,
    vaga_id INTEGER NOT NULL REFERENCES vaga(id) ON DELETE CASCADE,
    candidato_id INTEGER NOT NULL REFERENCES candidato(id) ON DELETE CASCADE,
    score_geral DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    habilidades_encontradas TEXT DEFAULT '[]' NOT NULL, -- JSON String
    habilidades_faltantes TEXT DEFAULT '[]' NOT NULL,    -- JSON String
    justificativa_fit TEXT DEFAULT '' NOT NULL,
    pontos_fortes TEXT DEFAULT '[]' NOT NULL,            -- JSON String
    pontos_atencao TEXT DEFAULT '[]' NOT NULL,           -- JSON String
    resumo_experiencia TEXT DEFAULT '' NOT NULL,
    status VARCHAR(50) DEFAULT 'pendente' NOT NULL,
    caminho_arquivo TEXT NOT NULL,
    data_analise TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Índices recomendados para otimização de buscas
CREATE INDEX IF NOT EXISTS idx_analisecv_vaga_id ON analisecv(vaga_id);
CREATE INDEX IF NOT EXISTS idx_analisecv_candidato_id ON analisecv(candidato_id);
CREATE INDEX IF NOT EXISTS idx_candidato_email ON candidato(email);
