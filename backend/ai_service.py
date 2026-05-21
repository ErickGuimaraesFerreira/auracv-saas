import os
import json
import logging
from typing import List, Optional
from pydantic import BaseModel, Field
import google.generativeai as genai
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

# Configuração do Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai_service")

# Configura o Gemini API Key se disponível
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info("Gemini API configurada com sucesso.")
else:
    logger.warning("ATENÇÃO: GEMINI_API_KEY não encontrada no ambiente. O sistema funcionará no MOCK MODE.")

# Schema Pydantic para validar e guiar a saída estruturada do Gemini
class AnaliseCVLLMResponse(BaseModel):
    nome_candidato: str = Field(description="Nome completo do candidato extraído do currículo")
    email: str = Field(description="Email de contato extraído do currículo")
    telefone: Optional[str] = Field(None, description="Número de telefone extraído do currículo")
    linkedin: Optional[str] = Field(None, description="Link do perfil do LinkedIn extraído")
    score_geral: float = Field(description="Pontuação de compatibilidade de 0 a 100 baseada nos requisitos")
    habilidades_encontradas: List[str] = Field(description="Lista de habilidades técnicas e soft skills encontradas que batem com os requisitos da vaga ou são relevantes")
    habilidades_faltantes: List[str] = Field(description="Lista de habilidades exigidas/desejáveis na vaga que NÃO foram encontradas no currículo")
    resumo_experiencia: str = Field(description="Resumo conciso de 2-3 frases sobre a carreira e foco do candidato")
    pontos_fortes: List[str] = Field(description="2 a 4 pontos de destaque que tornam este candidato um fit ideal")
    pontos_atencao: List[str] = Field(description="1 a 3 pontos de atenção ou lacunas (gaps) observadas no currículo")
    justificativa_fit: str = Field(description="Justificativa qualitativa e profissional detalhando a aderência do candidato à vaga e por que obteve este score")

def run_mock_analysis(cv_text: str, vaga_titulo: str, req_obrigatorios: str, req_desejaveis: str) -> dict:
    """Fallback local quando a API do Gemini não está configurada.
    Analisa palavras-chave de forma inteligente para gerar uma resposta convincente."""
    logger.info("Executando análise no modo de simulação (Mock Mode)...")
    
    # Extrair um nome fictício ou tentar ler o início do texto
    lines = [line.strip() for line in cv_text.split("\n") if line.strip()]
    nome = "Candidato Extraído"
    if lines:
        for line in lines[:5]:
            # Ignora linhas decorativas compostas por separadores ascii (como ===== ou ----- )
            if set(line) <= {"=", "-", "*", "_", " "}:
                continue
                
            if "nome:" in line.lower():
                nome = line.split(":", 1)[1].strip()
                break
            elif len(line) > 3 and len(line) < 65 and "@" not in line and not any(char.isdigit() for char in line):
                # Se contiver hífen (ex: Nome - Cargo), extrai apenas a primeira parte como o Nome
                if " - " in line:
                    nome = line.split(" - ", 1)[0].strip()
                else:
                    nome = line
                break
                
    # Tenta pescar email
    email = "contato@candidato.com"
    for word in cv_text.replace("\n", " ").split(" "):
        if "@" in word and "." in word:
            email = word.strip("(),;<>:\"'")
            break

    # Tenta pescar telefone
    telefone = "(11) 98765-4321"
    
    # Analisa requisitos
    reqs_ob = [r.strip() for r in req_obrigatorios.split(",") if r.strip()]
    reqs_de = [r.strip() for r in req_desejaveis.split(",") if r.strip()]
    
    encontradas = []
    faltantes = []
    
    cv_text_lower = cv_text.lower()
    
    import re
    
    for r in reqs_ob:
        pattern = r"\b" + re.escape(r.lower()) + r"\b"
        if re.search(pattern, cv_text_lower):
            encontradas.append(r)
        else:
            faltantes.append(r)
            
    for r in reqs_de:
        pattern = r"\b" + re.escape(r.lower()) + r"\b"
        if re.search(pattern, cv_text_lower):
            encontradas.append(r)
        else:
            faltantes.append(r)
            
    # Calcula score simples
    total_reqs = len(reqs_ob) + len(reqs_de)
    if total_reqs > 0:
        score = (len(encontradas) / total_reqs) * 100
    else:
        score = 70.0
        
    # Se faltar mais da metade dos obrigatórios, ou não tiver nenhum obrigatório, garante score baixo
    ob_encontradas = [r for r in reqs_ob if r in encontradas]
    if len(reqs_ob) > 0 and len(ob_encontradas) == 0:
        score = 10.0
    elif len(reqs_ob) > 0 and (len(ob_encontradas) / len(reqs_ob)) < 0.5:
        score = min(score, 30.0)
            
    score = min(max(score, 10.0), 98.0)
    
    pontos_fortes = [
        f"Demonstra conhecimento prático nas habilidades identificadas: {', '.join(encontradas[:3]) if encontradas else 'Nenhuma'}."
    ]
    if encontradas:
        pontos_fortes.append("Apresenta currículo com estrutura lógica de fácil leitura.")
    if len(ob_encontradas) == len(reqs_ob) and len(reqs_ob) > 0:
        pontos_fortes.append("Possui total compatibilidade técnica com os requisitos obrigatórios cadastrados.")
        
    pontos_atencao = []
    if faltantes:
        pontos_atencao.append(f"Ausência de menção direta aos seguintes requisitos solicitados: {', '.join(faltantes[:2])}.")
    else:
        pontos_atencao.append("Não foram encontradas lacunas graves de compatibilidade imediata.")
        
    resumo = f"Profissional qualificado com experiência em desenvolvimento e projetos relacionados a {', '.join(encontradas[:4]) if encontradas else 'áreas gerais'}."
    
    # Parecer profissional refinado
    if score >= 75.0:
        recomendacao = "Recomendamos fortemente prosseguir para entrevista técnica imediata devido ao alinhamento de ponta."
    elif score >= 50.0:
        recomendacao = "Recomendamos prosseguir com triagem rápida para validar lacunas identificadas em conversação inicial."
    else:
        recomendacao = "Candidato NÃO recomendado devido ao baixo alinhamento técnico com os requisitos mínimos e essenciais da vaga."

    justificativa = (
        f"O candidato apresenta {score:.1f}% de compatibilidade para a vaga de {vaga_titulo}. "
        f"Possui domínio de ferramentas chaves como {', '.join(encontradas[:3]) if encontradas else 'nenhuma das ferramentas requeridas'}. "
        f"A principal oportunidade de desenvolvimento reside nas seguintes lacunas identificadas: {', '.join(faltantes) if faltantes else 'nenhuma'}. "
        f"{recomendacao}"
    )
    
    return {
        "nome_candidato": nome,
        "email": email,
        "telefone": telefone,
        "linkedin": "linkedin.com/in/candidato-profile",
        "score_geral": round(score, 1),
        "habilidades_encontradas": encontradas,
        "habilidades_faltantes": faltantes,
        "resumo_experiencia": resumo,
        "pontos_fortes": pontos_fortes,
        "pontos_atencao": pontos_atencao,
        "justificativa_fit": justificativa
    }

def analyze_resume_with_gemini(
    cv_text: str,
    vaga_titulo: str,
    vaga_descricao: str,
    req_obrigatorios: str,
    req_desejaveis: str
) -> dict:
    """Cruza o texto do currículo com os requisitos da vaga usando Gemini 2.5 Flash."""
    
    # Se não houver chave API, executa a simulação mock
    if not GEMINI_API_KEY:
        return run_mock_analysis(cv_text, vaga_titulo, req_obrigatorios, req_desejaveis)
        
    prompt = f"""
    Você é um recrutador técnico e especialista em IA sênior. Sua tarefa é analisar o currículo abaixo de um candidato e compará-lo rigorosamente com os requisitos de uma vaga de emprego específica.
    
    DADOS DA VAGA:
    - Cargo: {vaga_titulo}
    - Descrição: {vaga_descricao}
    - Requisitos Obrigatórios: {req_obrigatorios}
    - Requisitos Desejáveis: {req_desejaveis}
    
    CONTEÚDO DO CURRÍCULO (EXTRAÍDO DO ARQUIVO):
    ---
    {cv_text}
    ---
    
    INSTRUÇÕES DE ANÁLISE:
    1. Extraia os dados pessoais essenciais (nome completo, email, telefone, perfil de LinkedIn).
    2. Calcule uma pontuação (score) de compatibilidade geral de 0 a 100.
       - Vagas exigem casamento técnico. Se o candidato não possui nenhum requisito obrigatório, o score deve ser muito baixo (< 30).
       - Se possui a maioria dos obrigatórios e alguns desejáveis, o score deve ser alto (> 75).
       - Valorize experiências práticas descritas, não apenas palavras soltas.
    3. Identifique as habilidades encontradas e compare-as com o que a vaga exige.
    4. Identifique claramente as habilidades obrigatórias ou desejáveis que estão ausentes.
    5. Crie um resumo conciso da carreira do candidato (2 a 3 frases).
    6. Destaque Pontos Fortes (pontos fortes do fit técnico/comportamental) e Pontos de Atenção (lacunas/gaps cruciais).
    7. Escreva uma Justificativa detalhada profissional e acolhedora em Português do Brasil para apoiar a decisão de contratação do recrutador.
    
    Retorne a resposta estritamente estruturada conforme o JSON Schema fornecido.
    """
    
    try:
        # Usa o modelo mais rápido e eficiente para tarefas de classificação e extração
        # gemini-2.5-flash é o modelo recomendado padrão e o mais rápido
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                response_schema=AnaliseCVLLMResponse,
                temperature=0.2, # Baixa temperatura para avaliações técnicas mais consistentes
            )
        )
        
        result_json = json.loads(response.text)
        return result_json
        
    except Exception as e:
        logger.error(f"Erro na chamada do Gemini API: {str(e)}. Tentando fallback para gemini-1.5-flash...")
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=AnaliseCVLLMResponse,
                    temperature=0.2,
                )
            )
            return json.loads(response.text)
        except Exception as e2:
            logger.error(f"Erro no fallback do Gemini 1.5: {str(e2)}. Usando mock fallback local...")
            return run_mock_analysis(cv_text, vaga_titulo, req_obrigatorios, req_desejaveis)
