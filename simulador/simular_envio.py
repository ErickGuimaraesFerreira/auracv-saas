import os
import requests

API_BASE_URL = "http://127.0.0.1:8080"
PASTA_ATUAL = os.path.dirname(os.path.abspath(__file__))

print("🚀 Iniciando Simulador de Integração de ATS (Via API REST)...")

# 1. Definir uma vaga de backend Python
vaga_data = {
    "titulo": "Desenvolvedor Backend Python",
    "departamento": "Engenharia de Software (Vaga Simulada)",
    "descricao": "Vaga simulada de teste. Procuramos especialista em backend com proficiência forte no stack Python e ferramentas de devops na nuvem.",
    "requisitos_obrigatorios": "Python, FastAPI, SQL, Git",
    "requisitos_desejaveis": "Docker, AWS"
}

print("\n1️⃣ Solicitando criação da Vaga Alvo na plataforma AuraCV...")
resp = requests.post(f"{API_BASE_URL}/api/vagas", json=vaga_data)
if resp.status_code != 201:
    print("❌ Erro ao criar vaga:", resp.text)
    exit(1)
    
vaga_id = resp.json()["id"]
print(f"✅ Vaga criada com sucesso! (ID da Vaga: {vaga_id})")

# 2. Carregar arquivos de CVs do lote
arquivos_para_enviar = [
    "cv_candidato_100_porcento.txt",
    "cv_candidato_90_porcento.txt",
    "cv_candidato_60_porcento.txt",
    "cv_candidato_10_porcento.txt"
]

files = []
# Prepara a lista de tuplas exigida pelo pacote 'requests' para múltiplos arquivos (multipart/form-data)
for nome_arquivo in arquivos_para_enviar:
    caminho = os.path.join(PASTA_ATUAL, nome_arquivo)
    files.append(("files", (nome_arquivo, open(caminho, "rb"), "text/plain")))

print(f"\n2️⃣ Disparando requisição POST para enviar {len(arquivos_para_enviar)} currículos em lote...")
upload_resp = requests.post(f"{API_BASE_URL}/api/vagas/{vaga_id}/upload", files=files)

# Fechar os arquivos
for _, file_tuple in files:
    file_tuple[1].close()

if upload_resp.status_code == 200:
    print("✅ Currículos recebidos, analisados via Inteligência Artificial e triados com sucesso!\n")
else:
    print("❌ Erro no upload:", upload_resp.text)
    exit(1)

# 3. Exibir o Ranking de Compatibilidade Resultante
print("3️⃣ Resultado do Ranqueamento IA:")
ranking = requests.get(f"{API_BASE_URL}/api/vagas/{vaga_id}/ranking").json()

print("-" * 75)
for i, candidato in enumerate(ranking, 1):
    print(f"🏆 Posição #{i}")
    print(f"   👤 Candidato: {candidato['candidato_nome']}")
    print(f"   🎯 Fit Geral: {candidato['score_geral']}%")
    print(f"   ✔️ Habilidades Identificadas: {', '.join(candidato['habilidades_encontradas']) if candidato['habilidades_encontradas'] else 'Nenhuma'}")
    print(f"   ⚠️ Habilidades Faltantes (Gaps): {', '.join(candidato['habilidades_faltantes']) if candidato['habilidades_faltantes'] else 'Nenhum'}")
    print(f"   📝 Parecer do Recrutador IA: {candidato['justificativa_fit']}")
    print("-" * 75)
    
print("\n✨ Simulação de integração externa finalizada!")
print("   Você pode abrir a interface visual em http://localhost:5173 para ver essa vaga e os dados!")
