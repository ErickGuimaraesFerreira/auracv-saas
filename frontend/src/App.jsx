import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Users,
  TrendingUp,
  Upload,
  FileText,
  Code,
  Plus,
  X,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Mail,
  Link,
  Phone,
  Info,
  Terminal,
  Copy,
  Cpu,
  Shield,
  User
} from 'lucide-react';

import PortalCandidato from './PortalCandidato';
import Login from './Login';
import { supabase } from './supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

function App() {
  const [session, setSession] = useState(null);

  // Escuta alterações de estado de autenticação do Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      const cards = document.querySelectorAll(".glass-card");
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const [appMode, setAppMode] = useState('candidato'); // 'admin' ou 'candidato' (inicia no público)
  const [activeTab, setActiveTab] = useState('vagas'); // 'dashboard', 'vagas', 'api'
  const [vagas, setVagas] = useState([]);
  const [selectedVagaId, setSelectedVagaId] = useState(null);
  const [ranking, setRanking] = useState([]);

  // Modals & Forms
  const [showCreateVagaModal, setShowCreateVagaModal] = useState(false);
  const [newVaga, setNewVaga] = useState({
    titulo: '',
    departamento: '',
    descricao: '',
    requisitos_obrigatorios: '',
    requisitos_desejaveis: ''
  });

  // Loading & Action states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');
  const [expandedCandidateId, setExpandedCandidateId] = useState(null);
  const [copiedText, setCopiedText] = useState(false);

  // Efeito para buscar as vagas ao inicializar ou mudar de tela
  useEffect(() => {
    if (appMode === 'admin') {
      fetchVagas();
    }
  }, [appMode]);

  // Efeito ao selecionar uma vaga ou alternar de tela para atualizar o ranking correspondente
  useEffect(() => {
    if (selectedVagaId && appMode === 'admin') {
      fetchRanking(selectedVagaId);
    } else if (!selectedVagaId) {
      setRanking([]);
    }
  }, [selectedVagaId, appMode]);

  const fetchVagas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vagas`);
      if (response.ok) {
        const data = await response.json();
        setVagas(data);
        if (data.length > 0 && !selectedVagaId) {
          setSelectedVagaId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar vagas:", error);
    }
  };

  const fetchRanking = async (vagaId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vagas/${vagaId}/ranking`);
      if (response.ok) {
        const data = await response.json();
        setRanking(data);
      }
    } catch (error) {
      console.error("Erro ao buscar ranking:", error);
    }
  };

  const handleCreateVaga = async (e) => {
    e.preventDefault();
    if (!newVaga.titulo || !newVaga.descricao) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/vagas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVaga)
      });

      if (response.ok) {
        const data = await response.json();
        setVagas([...vagas, data]);
        setSelectedVagaId(data.id);
        setShowCreateVagaModal(false);
        setNewVaga({
          titulo: '',
          departamento: '',
          descricao: '',
          requisitos_obrigatorios: '',
          requisitos_desejaveis: ''
        });
      }
    } catch (error) {
      console.error("Erro ao criar vaga:", error);
    }
  };

  const handleDeleteVaga = async (vagaId, e) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir esta vaga e todos os candidatos triados?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/vagas/${vagaId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const updatedVagas = vagas.filter(v => v.id !== vagaId);
        setVagas(updatedVagas);
        if (selectedVagaId === vagaId) {
          setSelectedVagaId(updatedVagas.length > 0 ? updatedVagas[0].id : null);
        }
      }
    } catch (error) {
      console.error("Erro ao excluir vaga:", error);
    }
  };

  const handleUploadFiles = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedVagaId) return;

    setIsUploading(true);
    setUploadStatusMsg("Extraindo texto e executando análise semântica com Inteligência Artificial...");

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/vagas/${selectedVagaId}/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setRanking(data);
      } else {
        alert("Erro no processamento dos currículos. Verifique o formato.");
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Houve uma falha na comunicação com o servidor.");
    } finally {
      setIsUploading(false);
      setUploadStatusMsg('');
      // Limpa o input file
      e.target.value = null;
    }
  };

  const handleDeleteAnalise = async (analiseId, e) => {
    e.stopPropagation();
    if (!confirm("Remover este candidato do ranking?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/analises/${analiseId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setRanking(ranking.filter(item => item.analise_id !== analiseId));
      }
    } catch (error) {
      console.error("Erro ao deletar análise:", error);
    }
  };

  // Funções Utilitárias de Estatísticas
  const getTotalCandidates = () => {
    return ranking.length;
  };

  const getAverageScore = () => {
    if (ranking.length === 0) return 0;
    const sum = ranking.reduce((acc, curr) => acc + curr.score_geral, 0);
    return Math.round(sum / ranking.length);
  };

  const getScoreColorClass = (score) => {
    if (score >= 75) return 'high';
    if (score >= 50) return 'mid';
    return 'low';
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Pre-seed helper to populate mock data for instantaneous demonstration
  const handleCreateMockSeed = async () => {
    try {
      // 1. Criar vaga mock
      const mockOpening = {
        titulo: "Desenvolvedor Backend Python Pleno",
        departamento: "Tecnologia & Produto",
        descricao: "Buscamos profissional experiente em Python e criação de microsserviços rápidos. Atuará na construção e manutenção de rotas de API escaláveis.",
        requisitos_obrigatorios: "Python, FastAPI, SQL, Git",
        requisitos_desejaveis: "Docker, AWS, Pydantic, NoSQL"
      };

      const response = await fetch(`${API_BASE_URL}/api/vagas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockOpening)
      });

      if (response.ok) {
        const vagaData = await response.json();
        setVagas(prev => [...prev, vagaData]);
        setSelectedVagaId(vagaData.id);

        // Simular upload enviando blobs fictícios
        setIsUploading(true);
        setUploadStatusMsg("Semeando candidatos fictícios de teste...");

        // Criar blobs de texto simulados para simular currículos reais
        const cv1Text = "NOME: Carlos Henrique Mendes\nEMAIL: carlos.mendes@email.com\nTELEFONE: (11) 98888-7777\nLINKEDIN: linkedin.com/in/carloshmendes\nEXPERIÊNCIA:\n- Dev Backend na Startup X por 3 anos desenvolvendo APIs em Python e Django.\n- Criação de queries complexas em PostgreSQL.\n- Controle de versão com Git.\nHABILIDADES: Python, Django, SQL, PostgreSQL, Git, Docker, RESTful APIs.";
        const cv2Text = "NOME: Mariana Sousa Araujo\nEMAIL: mariana.araujo@outlook.com\nTELEFONE: (21) 97777-6666\nEXPERIÊNCIA:\n- Engenheira de Software na Tech Corp (2 anos).\n- Criação de microsserviços performáticos usando Python, FastAPI e Pydantic.\n- Configuração de pipelines Docker no ambiente local.\n- Monitoramento básico em nuvem AWS.\nHABILIDADES: Python, FastAPI, Pydantic, Docker, AWS, Git, SQL, PostgreSQL, MongoDB.";
        const cv3Text = "NOME: Lucas da Costa Lima\nEMAIL: lucas.lima@yahoo.com\nTELEFONE: (31) 96666-5555\nEXPERIÊNCIA:\n- Desenvolvedor Frontend React Jr (1 ano).\n- Criação de interfaces responsivas com Javascript, HTML e CSS.\n- Pequena experiência acadêmica com Python básico.\nHABILIDADES: React, Javascript, HTML, CSS, Git, Python básico.";

        const file1 = new File([cv1Text], "carlos_cv.txt", { type: "text/plain" });
        const file2 = new File([cv2Text], "mariana_cv.txt", { type: "text/plain" });
        const file3 = new File([cv3Text], "lucas_cv.txt", { type: "text/plain" });

        const formData = new FormData();
        formData.append("files", file1);
        formData.append("files", file2);
        formData.append("files", file3);

        const uploadResponse = await fetch(`${API_BASE_URL}/api/vagas/${vagaData.id}/upload`, {
          method: 'POST',
          body: formData
        });

        if (uploadResponse.ok) {
          const rankingData = await uploadResponse.json();
          setRanking(rankingData);
        }
      }
    } catch (e) {
      console.error("Erro ao semear dados:", e);
    } finally {
      setIsUploading(false);
      setUploadStatusMsg('');
    }
  };

  const selectedVaga = vagas.find(v => v.id === selectedVagaId);

  // Snippets de código para o ATS
  const curlSnippet = `curl -X POST "${API_BASE_URL}/api/vagas/${selectedVagaId || 'VAGA_ID'}/upload" \\
  -H "accept: application/json" \\
  -H "Content-Type: multipart/form-data" \\
  -F "files=@/caminho/do/seu/curriculo.pdf"`;

  const jsSnippet = `const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append("files", file);

  const response = await fetch("${API_BASE_URL}/api/vagas/${selectedVagaId || 'VAGA_ID'}/upload", {
    method: "POST",
    body: formData
  });

  if (response.ok) {
    const updatedRanking = await response.json();
    console.log("Ranking atualizado:", updatedRanking);
  }
};`;

  if (appMode === 'candidato') {
    return <PortalCandidato setAppMode={setAppMode} />;
  }

  // Interceptor de Autenticação Supabase para a Área do RH (admin)
  if (appMode === 'admin' && !session) {
    return (
      <Login 
        onLoginSuccess={(newSession) => setSession(newSession)}
        onCancel={() => setAppMode('candidato')}
      />
    );
  }

  return (
    <div className="app-container">
      {/* HEADER PRINCIPAL */}
      <header className="app-header">
        <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="Nodfy Logo" style={{ height: '42px', width: 'auto', objectFit: 'contain' }} />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1 className="logo-text" style={{ fontSize: '0.85rem', color: '#52525b', fontWeight: '400', letterSpacing: '-0.1px', textTransform: 'none', margin: 0, lineHeight: 1 }}>
              Nodfy - Soluções Inteligentes
            </h1>
          </div>
        </div>

        {/* ABAS DE NAVEGAÇÃO */}
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === 'vagas' ? 'active' : ''}`}
            onClick={() => setActiveTab('vagas')}
          >
            <Briefcase size={16} /> Triagem & Vagas
          </button>
          <button
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <TrendingUp size={16} /> Insights & Analytics
          </button>
          <button
            className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            <Code size={16} /> ATS Developer API
          </button>

          <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.15)', margin: '0 8px' }}></div>

          <button
            className="tab-btn"
            onClick={() => setAppMode('candidato')}
            style={{ color: '#3f3f46', fontWeight: '700' }}
          >
            <User size={16} /> Portal de Vagas (Público)
          </button>

          {/* DADOS DO USUÁRIO LOGADO & LOGOUT */}
          {session && (
            <>
              <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.15)', margin: '0 12px' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: '500' }}>
                  {session.user.email}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    background: '#e6223d',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 6px rgba(230, 34, 61, 0.25)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(230, 34, 61, 0.35)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(230, 34, 61, 0.25)';
                  }}
                >
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* PAINEL DE INSIGHTS & ANALYTICS */}
      {activeTab === 'dashboard' && (
        <div>
          <div className="stats-row">
            <div className="glass-card stat-card">
              <div className="flashlight-border"></div>
              <div className="stat-info">
                <h3>Vagas Cadastradas</h3>
                <div className="stat-value">{vagas.length}</div>
              </div>
              <div className="stat-icon-wrapper">
                <Briefcase size={22} color="#6366f1" />
              </div>
            </div>
            <div className="glass-card stat-card">
              <div className="flashlight-border"></div>
              <div className="stat-info">
                <h3>Candidatos Triados</h3>
                <div className="stat-value">{getTotalCandidates()}</div>
              </div>
              <div className="stat-icon-wrapper">
                <Users size={22} color="#06b6d4" />
              </div>
            </div>
            <div className="glass-card stat-card">
              <div className="flashlight-border"></div>
              <div className="stat-info">
                <h3>Fit Médio Geral</h3>
                <div className="stat-value">{getAverageScore()}%</div>
              </div>
              <div className="stat-icon-wrapper">
                <TrendingUp size={22} color="#10b981" />
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '2rem' }}>
            <div className="flashlight-border"></div>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={20} color="#6366f1" /> Inteligência de Triagem AuraCV
            </h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.7', fontSize: '0.95rem' }}>
              Nosso sistema utiliza modelos de linguagem de ponta (<strong>Gemini 2.5 Flash</strong>) para ler dados e analisar perfis profissionalmente.
              Ao cruzar informações dos currículos anexados com as exigências obrigatórias e recomendadas estabelecidas, a IA produz notas precisas de aderência semântica e gera justificativas detalhadas.
              Dessa forma, o departamento de Recursos Humanos economiza cerca de 80% do tempo de triagem manual inicial.
            </p>
          </div>
        </div>
      )}

      {/* ABA PRINCIPAL: TRIAGEM E VAGAS */}
      {activeTab === 'vagas' && (
        <div className="dashboard-grid">

          {/* SIDEBAR: VAGAS */}
          <aside className="sidebar">
            <div className="section-title">
              <span>Minhas Vagas</span>
              <button
                className="action-btn-sm"
                onClick={() => setShowCreateVagaModal(true)}
                style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)', color: '#a5b4fc' }}
              >
                <Plus size={14} /> Nova Vaga
              </button>
            </div>

            <div className="vaga-list">
              {vagas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b', fontSize: '0.85rem' }}>
                  Nenhuma vaga cadastrada.
                  <div className="btn-beam-container w-full sm:w-auto">
                    <div className="beam-border"></div>
                    <button
                      onClick={handleCreateMockSeed}
                      className="btn-primary"
                      style={{ marginTop: '1rem', padding: '0.5rem' }}
                    >
                      Gerar Vaga Fictícia ⚡

                    </button>
                  </div>
                </div>
              ) : (
                vagas.map((v) => (
                  <div
                    key={v.id}
                    className={`vaga-card ${selectedVagaId === v.id ? 'active' : ''}`}
                    onClick={() => setSelectedVagaId(v.id)}
                  >
                    <div className="vaga-card-header">
                      <h4>{v.titulo}</h4>
                      <button
                        onClick={(e) => handleDeleteVaga(v.id, e)}
                        className="close-btn"
                        style={{ padding: '2px', color: '#64748b' }}
                        title="Excluir vaga"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="vaga-dept">{v.departamento || 'Geral'}</div>
                    <div className="vaga-meta">
                      <span>Criada em: {new Date(v.data_criacao).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* ÁREA DE EXIBIÇÃO DA VAGA SELECIONADA */}
          <main className="main-display">
            {selectedVaga ? (
              <>
                {/* BANNER DA VAGA */}
                <section className="glass-card vaga-banner">
                  <div className="banner-header">
                    <div className="banner-title">
                      <h2>{selectedVaga.titulo}</h2>
                      <div className="banner-subtitle">Departamento: {selectedVaga.departamento || 'Geral'}</div>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#27272a', lineHeight: '1.5', marginTop: '0.5rem' }}>
                    {selectedVaga.descricao}
                  </p>

                  <div className="banner-reqs">
                    {selectedVaga.requisitos_obrigatorios && (
                      <div>
                        <div className="req-label" style={{ marginBottom: '4px' }}>Requisitos Obrigatórios:</div>
                        <div className="tag-container">
                          {selectedVaga.requisitos_obrigatorios.split(',').map((req, idx) => (
                            <span key={idx} className="tag-ob">{req.trim()}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedVaga.requisitos_desejaveis && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div className="req-label" style={{ marginBottom: '4px' }}>Requisitos Desejáveis:</div>
                        <div className="tag-container">
                          {selectedVaga.requisitos_desejaveis.split(',').map((req, idx) => (
                            <span key={idx} className="tag-de">{req.trim()}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* DROPZONE DE UPLOAD */}
                {!isUploading ? (
                  <section className="glass-card">
                    <label className="dropzone">
                      <div className="dropzone-icon">
                        <Upload size={24} />
                      </div>
                      <h3>Anexar Currículos dos Candidatos</h3>
                      <p>Arraste arquivos ou clique para selecionar. Suporta múltiplos arquivos em formato PDF ou DOCX simultaneamente.</p>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.docx,.doc,.txt"
                        onChange={handleUploadFiles}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </section>
                ) : (
                  /* PROCESSANDO ANIMADO */
                  <section className="glass-card processing-card">
                    <div className="radar-spinner">
                      <div className="radar-circle"></div>
                      <div className="radar-inner"></div>
                      <Cpu size={32} />
                    </div>
                    <h3>Inteligência Artificial Analisando...</h3>
                    <p>{uploadStatusMsg}</p>
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill"></div>
                    </div>
                  </section>
                )}

                {/* RANKING DE CANDIDATOS */}
                <section className="ranking-container">
                  <div className="ranking-title">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Ranking de Compatibilidade</h3>
                    <span className="ranking-count">{ranking.length} Candidatos</span>
                  </div>

                  {ranking.length === 0 ? (
                    <div className="glass-card empty-state">
                      <div className="flashlight-border"></div>
                      <Users size={48} />
                      <h3>Nenhum currículo triado</h3>
                      <p>Faça upload de um ou mais currículos no formato PDF ou Word acima para gerar a análise e o ranking.</p>
                    </div>
                  ) : (
                    <div className="ranking-list">
                      {ranking.map((candidate, index) => {
                        const isExpanded = expandedCandidateId === candidate.analise_id;
                        const scoreClass = getScoreColorClass(candidate.score_geral);

                        return (
                          <div key={candidate.analise_id} className="candidate-row">

                            {/* LINHA RESUMO DO CARD */}
                            <button
                              className={`candidate-summary-btn ${isExpanded ? 'expanded' : ''}`}
                              onClick={() => setExpandedCandidateId(isExpanded ? null : candidate.analise_id)}
                            >
                              <span className="candidate-index">#{String(index + 1).padStart(2, '0')}</span>

                              <div className="candidate-info">
                                <h4>{candidate.candidato_nome}</h4>
                                <p>
                                  <span>{candidate.candidato_email}</span>
                                  {candidate.candidato_telefone && (
                                    <>
                                      <span style={{ color: '#475569' }}>•</span>
                                      <span>{candidate.candidato_telefone}</span>
                                    </>
                                  )}
                                </p>
                              </div>

                              <div className="candidate-skills-overview">
                                {candidate.habilidades_encontradas.slice(0, 4).map((skill, sIdx) => (
                                  <span key={sIdx} className="mini-skill-badge">{skill}</span>
                                ))}
                                {candidate.habilidades_encontradas.length > 4 && (
                                  <span className="mini-skill-badge">+{candidate.habilidades_encontradas.length - 4}</span>
                                )}
                              </div>

                              <div className="recommendation-badge-container">
                                {candidate.score_geral >= 75 ? (
                                  <span className="badge-rec approved">Alta Compatibilidade</span>
                                ) : candidate.score_geral >= 50 ? (
                                  <span className="badge-rec warning">Média Compatibilidade</span>
                                ) : (
                                  <span className="badge-rec rejected">Baixa Compatibilidade</span>
                                )}
                              </div>

                              <div className="score-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span className={`score-number ${scoreClass}`}>
                                  {Math.round(candidate.score_geral)}%
                                </span>
                                {candidate.score_geral >= 75 ? (
                                  <CheckCircle size={16} style={{ color: 'var(--color-high-fit)', flexShrink: 0 }} />
                                ) : candidate.score_geral >= 50 ? (
                                  <Info size={16} style={{ color: 'var(--color-mid-fit)', flexShrink: 0 }} />
                                ) : (
                                  <AlertTriangle size={16} style={{ color: 'var(--color-low-fit)', flexShrink: 0 }} />
                                )}
                              </div>

                              <div style={{ color: '#64748b' }}>
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </div>
                            </button>

                            {/* CONTEÚDO EXPANDIDO - DETALHES DE IA */}
                            {isExpanded && (
                              <div className="candidate-detail-pane">

                                {/* COLUNA ESQUERDA: JUSTIFICATIVA DE FIT E RESUMO */}
                                <div className="detail-section">
                                  <h5>Justificativa do Recrutador (IA)</h5>
                                  <p className="justification-text">{candidate.justificativa_fit}</p>

                                  <h5 style={{ marginTop: '0.5rem' }}>Resumo Profissional</h5>
                                  <p className="experience-summary">{candidate.resumo_experiencia}</p>
                                </div>

                                {/* COLUNA DIREITA: HABILIDADES E HIGHLIGHTS */}
                                <div className="detail-section">
                                  <h5>Radar de Requisitos (Skill Gap)</h5>
                                  <div className="skills-comparison">
                                    <div>
                                      <div className="req-label" style={{ marginBottom: '4px', color: '#10b981' }}>Habilidades Identificadas:</div>
                                      <div className="skill-list-detail">
                                        {candidate.habilidades_encontradas.length === 0 ? (
                                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Nenhuma identificada</span>
                                        ) : (
                                          candidate.habilidades_encontradas.map((s, idx) => (
                                            <span key={idx} className="badge-skill-found">
                                              <CheckCircle size={10} /> {s}
                                            </span>
                                          ))
                                        )}
                                      </div>
                                    </div>

                                    <div style={{ marginTop: '0.5rem' }}>
                                      <div className="req-label" style={{ marginBottom: '4px', color: '#fca5a5' }}>Requisitos Ausentes no CV:</div>
                                      <div className="skill-list-detail">
                                        {candidate.habilidades_faltantes.length === 0 ? (
                                          <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                            <CheckCircle size={11} /> Nenhum gap importante
                                          </span>
                                        ) : (
                                          candidate.habilidades_faltantes.map((s, idx) => (
                                            <span key={idx} className="badge-skill-missing">
                                              <AlertTriangle size={10} /> {s}
                                            </span>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* PONTOS FORTES E DE ATENÇÃO */}
                                  <div className="highlights-container" style={{ marginTop: '0.75rem' }}>
                                    <div className="highlight-box strengths">
                                      <div className="req-label" style={{ color: '#10b981' }}>Pontos Fortes</div>
                                      <ul className="highlight-list strengths-list">
                                        {candidate.pontos_fortes.map((p, pIdx) => (
                                          <li key={pIdx}><CheckCircle size={10} style={{ marginTop: '3px' }} /> {p}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div className="highlight-box gaps">
                                      <div className="req-label" style={{ color: '#f59e0b' }}>Pontos de Atenção</div>
                                      <ul className="highlight-list gaps-list">
                                        {candidate.pontos_atencao.map((p, pIdx) => (
                                          <li key={pIdx}><AlertTriangle size={10} style={{ marginTop: '3px' }} /> {p}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </div>

                                {/* LINHA DE AÇÕES */}
                                <div className="detail-actions-row">
                                  <div className="candidate-info">
                                    <p style={{ gap: '1rem' }}>
                                      {candidate.candidato_linkedin && (
                                        <a
                                          href={`https://${candidate.candidato_linkedin.replace('https://', '')}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="action-btn-sm"
                                          style={{ display: 'inline-flex' }}
                                        >
                                          <Link size={12} /> Perfil LinkedIn
                                        </a>
                                      )}
                                      <a
                                        href={`mailto:${candidate.candidato_email}`}
                                        className="action-btn-sm"
                                        style={{ display: 'inline-flex' }}
                                      >
                                        <Mail size={12} /> Enviar E-mail
                                      </a>
                                    </p>
                                  </div>
                                  <div className="action-buttons-group">
                                    <button
                                      onClick={(e) => handleDeleteAnalise(candidate.analise_id, e)}
                                      className="action-btn-danger-sm"
                                    >
                                      <Trash2 size={12} /> Descartar Candidato
                                    </button>
                                  </div>
                                </div>

                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            ) : (
              <div className="glass-card empty-state">
                <div className="flashlight-border"></div>
                <Briefcase size={54} />
                <h3>Nenhuma vaga selecionada</h3>
                <p>Crie uma vaga ou selecione uma existente no painel esquerdo para começar a triagem.</p>
                <div className="btn-beam-container w-full sm:w-auto">
                  <div className="beam-border"></div>
                  <button className="btn-primary" onClick={() => setShowCreateVagaModal(true)} style={{ maxWidth: '200px', marginTop: '1rem' }}>
                    <Plus size={16} /> Criar Nova Vaga

                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* ABA DA API DO DESENVOLVEDOR (ATS INTEGRATION) */}
      {activeTab === 'api' && (
        <div className="glass-card api-container" style={{ padding: '2rem' }}>
          <div className="flashlight-border"></div>
          <div className="api-intro">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={22} color="#6366f1" /> Central de Integração ATS (API REST)
            </h3>
            <p style={{ marginTop: '0.5rem' }}>
              Conecte AuraCV diretamente no fluxo de trabalho de qualquer ATS de mercado (como Gupy, Greenhouse ou Lever).
              Quando um candidato anexa seu currículo no formulário de inscrição, você pode automatizar o envio do arquivo para triagem técnica e IA e consultar os scores atualizados em tempo real.
            </p>
          </div>

          <div className="api-grid">
            <div className="glass-card api-card">
              <div className="flashlight-border"></div>
              <div className="api-card-header">
                <span className="api-method-badge post">POST</span>
                <span className="api-endpoint-text">/api/vagas/{'{vaga_id}'}/upload</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                Envia um currículo (PDF/DOCX) para triagem na vaga especificada. Retorna a lista completa de ranking reordenada.
              </p>

              <div className="req-label">Requisição cURL:</div>
              <div className="code-box">
                <button className="code-copy-btn" onClick={() => copyToClipboard(curlSnippet)}>
                  <Copy size={12} /> {copiedText ? "Copiado!" : "Copiar"}
                </button>
                {curlSnippet}
              </div>

              <div className="req-label" style={{ marginTop: '1rem' }}>Exemplo em JavaScript (Fetch):</div>
              <div className="code-box">
                <button className="code-copy-btn" onClick={() => copyToClipboard(jsSnippet)}>
                  <Copy size={12} /> {copiedText ? "Copiado!" : "Copiar"}
                </button>
                {jsSnippet}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO DE VAGA */}
      {showCreateVagaModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content">
            <div className="flashlight-border"></div>
            <div className="modal-header">
              <h3>Criar Nova Vaga de Emprego</h3>
              <button className="close-btn" onClick={() => setShowCreateVagaModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateVaga}>
              <div className="form-group">
                <label htmlFor="titulo">Cargo / Título da Vaga*</label>
                <input
                  type="text"
                  id="titulo"
                  className="form-input"
                  placeholder="Ex: Desenvolvedor React Frontend Pleno"
                  required
                  value={newVaga.titulo}
                  onChange={(e) => setNewVaga({ ...newVaga, titulo: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="dept">Departamento</label>
                <input
                  type="text"
                  id="dept"
                  className="form-input"
                  placeholder="Ex: Tecnologia / Produto"
                  value={newVaga.departamento}
                  onChange={(e) => setNewVaga({ ...newVaga, departamento: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="desc">Descrição Geral da Oportunidade*</label>
                <textarea
                  id="desc"
                  className="form-input"
                  rows="4"
                  placeholder="Descreva as responsabilidades diárias e o escopo de atuação do profissional..."
                  required
                  value={newVaga.descricao}
                  onChange={(e) => setNewVaga({ ...newVaga, descricao: e.target.value })}
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="req_ob">Requisitos Obrigatórios (Separados por vírgula)*</label>
                <input
                  type="text"
                  id="req_ob"
                  className="form-input"
                  placeholder="Ex: React, Javascript, Git, APIs RESTful"
                  required
                  value={newVaga.requisitos_obrigatorios}
                  onChange={(e) => setNewVaga({ ...newVaga, requisitos_obrigatorios: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="req_de">Requisitos Desejáveis / Diferenciais (Separados por vírgula)</label>
                <input
                  type="text"
                  id="req_de"
                  className="form-input"
                  placeholder="Ex: TypeScript, TailwindCSS, Figma, Docker"
                  value={newVaga.requisitos_desejaveis}
                  onChange={(e) => setNewVaga({ ...newVaga, requisitos_desejaveis: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateVagaModal(false)}>
                  Cancelar
                </button>
                <div className="btn-beam-container w-full sm:w-auto">
                  <div className="beam-border"></div>
                  <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                    Publicar Vaga & Iniciar Triagem
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RODAPÉ DO SITE (Letras Miúdas) */}
      <footer style={{ 
        textAlign: 'center', 
        padding: '30px 10px 10px 10px', 
        marginTop: '4rem', 
        fontSize: '0.75rem', 
        color: '#71717a',
        borderTop: '1px solid #e4e4e7',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>&copy; {new Date().getFullYear()} Nodfy. Todos os direitos reservados.</span>
        <span style={{ color: '#d4d4d8' }}>•</span>
        <span style={{ fontWeight: '500' }}>ATS v1.0</span>
      </footer>
    </div>
  );
}

export default App;
