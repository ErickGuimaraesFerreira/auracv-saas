import React, { useState, useEffect } from 'react';
import { Briefcase, Upload, CheckCircle, ArrowLeft, Building2, MapPin, Loader2, Users } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function PortalCandidato({ setAppMode }) {
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
  const [vagas, setVagas] = useState([]);
  const [selectedVaga, setSelectedVaga] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchVagas();
  }, []);

  const fetchVagas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vagas`);
      if (response.ok) {
        const data = await response.json();
        setVagas(data);
      }
    } catch (error) {
      console.error("Erro ao buscar vagas:", error);
    }
  };

  const handleUploadFiles = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedVaga) return;

    setIsUploading(true);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/vagas/${selectedVaga.id}/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        alert("Erro no envio do currículo.");
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Falha na comunicação com o servidor.");
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  return (
    <div className="app-container portal-container">
      {/* HEADER PÚBLICO */}
      <header className="app-header">
        <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="Nodfy Logo" style={{ height: '42px', width: 'auto', objectFit: 'contain' }} />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1 className="logo-text" style={{ fontSize: '0.85rem', color: '#52525b', fontWeight: '400', letterSpacing: '-0.1px', textTransform: 'none', margin: 0, lineHeight: 1 }}>
              Nodfy - Portal de Oportunidades
            </h1>
          </div>
        </div>
        <button className="btn-secondary" style={{ width: 'auto' }} onClick={() => setAppMode('admin')}>
          Acesso Restrito (RH)
        </button>
      </header>

      <main className="portal-main">
        {!selectedVaga ? (
          <div className="vagas-grid-public">
            <div className="portal-hero glass-card" style={{ padding: '3rem 2rem', textAlign: 'center', marginBottom: '2rem' }}>
              <div className="flashlight-border"></div>
              <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#09090b' }}>Oportunidades em Aberto</h2>
              <p style={{ color: '#52525b', fontSize: '1.1rem' }}>Encontre a vaga ideal para o seu perfil e envie seu currículo com apenas um clique.</p>
            </div>

            {vagas.length === 0 ? (
              <div className="glass-card empty-state">
                <div className="flashlight-border"></div>
                <Briefcase size={54} color="#64748b" />
                <h3>Nenhuma vaga aberta no momento</h3>
                <p>Fique de olho! Nossas áreas de atração de talentos postarão novas oportunidades em breve.</p>
              </div>
            ) : (
              <div className="public-vaga-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                {vagas.map(v => (
                  <div key={v.id} className="glass-card public-vaga-card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => setSelectedVaga(v)}>
                    <div className="flashlight-border"></div>
                    <div className="vaga-card-header" style={{ marginBottom: '0.75rem' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#09090b' }}>{v.titulo}</h3>
                    </div>
                    <span className="tag-de" style={{ alignSelf: 'flex-start', marginBottom: '1rem' }}>{v.departamento || 'Geral'}</span>

                    <p style={{ fontSize: '0.85rem', color: '#52525b', marginBottom: '1.5rem', flex: 1 }}>
                      {v.descricao.length > 130 ? v.descricao.substring(0, 130) + '...' : v.descricao}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1rem', fontSize: '0.8rem', color: '#71717a' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} /> Híbrido
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={14} /> {v.candidatos_count || 0} candidato(s)
                      </span>
                      <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>Detalhes &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="vaga-detail-public glass-card" style={{ padding: '2.5rem', maxWidth: '800px', margin: '0 auto' }}>
            <div className="flashlight-border"></div>
            <button className="btn-secondary" style={{ width: 'auto', marginBottom: '2rem', padding: '0.5rem 1rem' }} onClick={() => { setSelectedVaga(null); setSuccess(false); }}>
              <ArrowLeft size={16} /> Voltar para lista de vagas
            </button>

            <div className="vaga-detail-header" style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '2rem', color: '#09090b', marginBottom: '0.75rem' }}>{selectedVaga.titulo}</h2>
              <div style={{ display: 'flex', gap: '1.5rem', color: '#71717a', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Building2 size={16} color="#71717a" /> {selectedVaga.departamento || 'Geral'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} color="#71717a" /> Modelo Híbrido</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={16} color="#71717a" /> {selectedVaga.candidatos_count || 0} currículo(s) enviado(s)</span>
              </div>
            </div>

            <div className="vaga-detail-body" style={{ marginBottom: '2.5rem' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: '#09090b', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '0.5rem' }}>Sobre a Posição</h3>
                <p style={{ color: '#27272a', lineHeight: '1.7' }}>{selectedVaga.descricao}</p>
              </div>

              {selectedVaga.requisitos_obrigatorios && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#09090b' }}>Requisitos Obrigatórios</h3>
                  <div className="tag-container">
                    {selectedVaga.requisitos_obrigatorios.split(',').map((req, idx) => (
                      <span key={idx} className="tag-ob" style={{ fontSize: '0.85rem', padding: '4px 12px' }}>{req.trim()}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedVaga.requisitos_desejaveis && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#09090b' }}>Diferenciais (Nice to have)</h3>
                  <div className="tag-container">
                    {selectedVaga.requisitos_desejaveis.split(',').map((req, idx) => (
                      <span key={idx} className="tag-de" style={{ fontSize: '0.85rem', padding: '4px 12px' }}>{req.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="apply-section" style={{ background: '#ffffff', padding: '2rem', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
              {success ? (
                <div className="success-banner" style={{ textAlign: 'center', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <CheckCircle size={56} color="#10b981" />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', color: '#09090b', marginBottom: '0.5rem' }}>Currículo Recebido!</h3>
                  <p style={{ color: '#52525b', marginBottom: '1.5rem' }}>Obrigado por se candidatar. Nosso time analisará o seu perfil e entrará em contato em até 3 dias caso seu perfil esteja de acordo com a vaga.</p>
                  <button className="btn-secondary" style={{ margin: '0 auto', width: 'auto' }} onClick={() => { setSelectedVaga(null); setSuccess(false); }}>
                    Voltar às Vagas
                  </button>
                </div>
              ) : (
                <div className="upload-box" style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.25rem', color: '#09090b', marginBottom: '0.5rem' }}>Candidate-se a esta vaga</h3>
                  <p style={{ color: '#52525b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Não preencha formulários enormes. Envie seu PDF e nossa IA processará suas informações automaticamente.</p>

                  {isUploading ? (
                    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <Loader2 size={32} className="radar-spinner" style={{ animation: 'rotate-radar 1s linear infinite', color: 'var(--primary-color)' }} />
                      <span style={{ color: '#09090b', fontWeight: '600' }}>Enviando e processando currículo...</span>
                    </div>
                  ) : (
                    <label className="dropzone" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '2rem', borderRadius: '12px', cursor: 'pointer' }}>
                      <div className="dropzone-icon" style={{ padding: '1rem', borderRadius: '50%' }}>
                        <Upload size={28} />
                      </div>
                      <span style={{ fontWeight: '600', color: '#09090b' }}>Anexar Currículo (PDF, Word)</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Tamanho máximo: 10MB</span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.txt"
                        onChange={handleUploadFiles}
                        style={{ display: 'none' }}
                        disabled={isUploading}
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

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
