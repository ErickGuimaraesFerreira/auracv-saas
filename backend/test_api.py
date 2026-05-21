import requests
import io
import json

API_BASE_URL = "http://127.0.0.1:8080"

def run_tests():
    print("🚀 Iniciando testes de validação da API AuraCV...")
    
    # 1. Criação de Vaga
    vaga_data = {
        "titulo": "Engenheiro de Dados Python Sênior",
        "departamento": "Data Engineering",
        "descricao": "Procuramos engenheiro sênior para gerenciar pipelines de dados em larga escala usando Python, Spark, e bancos SQL.",
        "requisitos_obrigatorios": "Python, Spark, SQL, Git",
        "requisitos_desejaveis": "Docker, Kubernetes, AWS, Airflow"
    }
    
    print("\n1. Criando vaga de teste...")
    response = requests.post(f"{API_BASE_URL}/api/vagas", json=vaga_data)
    if response.status_code == 201:
        vaga = response.json()
        vaga_id = vaga["id"]
        print(f"✅ Vaga criada com sucesso! ID: {vaga_id}")
        print(json.dumps(vaga, indent=2, ensure_ascii=False))
    else:
        print(f"❌ Falha ao criar vaga. Status: {response.status_code}")
        print(response.text)
        return

    # 2. Upload de Currículo de Teste
    cv_content = """
    NOME: Roberto Carlos Oliveira
    EMAIL: roberto.data@outlook.com
    TELEFONE: (11) 97777-8888
    LINKEDIN: linkedin.com/in/robertodata
    
    EXPERIÊNCIA:
    - Engenheiro de Dados Sênior na Tech Analytics (4 anos). 
      Desenvolvimento de ETLs usando Apache Spark e scripts avançados em Python. 
      Otimização de queries SQL complexas em PostgreSQL.
    - Versionamento de código feito totalmente no Git.
    - Configuração básica de Docker containers locais.
    
    HABILIDADES: Python, Apache Spark, SQL, Git, PostgreSQL, Docker.
    """
    
    # Prepara o arquivo fictício em memória para upload
    files = {
        "files": ("roberto_cv.txt", io.StringIO(cv_content), "text/plain")
    }
    
    print(f"\n2. Enviando currículo do candidato Roberto Oliveira para vaga ID {vaga_id}...")
    upload_response = requests.post(f"{API_BASE_URL}/api/vagas/{vaga_id}/upload", files=files)
    
    if upload_response.status_code == 200:
        ranking = upload_response.json()
        print(f"✅ Currículo processado e triado com sucesso!")
        print(f"✅ Ranking atualizado obtido ({len(ranking)} candidato(s)):")
        print(json.dumps(ranking, indent=2, ensure_ascii=False))
    else:
        print(f"❌ Falha no upload e triagem. Status: {upload_response.status_code}")
        print(upload_response.text)
        return

    # 3. Consulta direta ao Ranking da vaga
    print(f"\n3. Consultando ranking geral da vaga ID {vaga_id}...")
    ranking_response = requests.get(f"{API_BASE_URL}/api/vagas/{vaga_id}/ranking")
    if ranking_response.status_code == 200:
        ranking_data = ranking_response.json()
        print(f"✅ Consulta de ranking bem sucedida! Melhor candidato:")
        if ranking_data:
            c = ranking_data[0]
            print(f"   Nome: {c['candidato_nome']}")
            print(f"   Score Geral: {c['score_geral']}%")
            print(f"   Habilidades Encontradas: {c['habilidades_encontradas']}")
            print(f"   Habilidades Faltantes: {c['habilidades_faltantes']}")
            print(f"   Justificativa fit: {c['justificativa_fit']}")
        else:
            print("   Nenhum candidato encontrado no ranking.")
    else:
        print(f"❌ Falha ao buscar ranking. Status: {ranking_response.status_code}")
        print(ranking_response.text)

if __name__ == "__main__":
    run_tests()
