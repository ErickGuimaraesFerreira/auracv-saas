import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Mail, Lock, Eye, EyeOff, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Login({ onLoginSuccess, onCancel }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data?.session) {
        onLoginSuccess(data.session);
      }
    } catch (err) {
      console.error('Erro de Autenticação:', err);
      if (err.message === 'Invalid login credentials') {
        setError('E-mail ou senha incorretos. Verifique suas credenciais.');
      } else if (err.message === 'Email not confirmed') {
        setError('E-mail ainda não confirmado. Verifique sua caixa de entrada e spam.');
      } else {
        setError(err.message || 'Erro ao realizar login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#f4f4f5',
      padding: '20px',
      fontFamily: 'inherit'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '2.5rem',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
        border: '1px solid rgba(0, 0, 0, 0.06)'
      }}>
        <div className="flashlight-border"></div>

        {/* LOGO E TÍTULO */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img 
            src="/logo.png" 
            alt="Nodfy Logo" 
            style={{ height: '48px', width: 'auto', objectFit: 'contain', marginBottom: '1rem' }} 
          />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#09090b', marginBottom: '0.35rem' }}>
            Nodfy - Soluções Inteligentes
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#71717a' }}>
            Acesso exclusivo para o time de Recursos Humanos
          </p>
        </div>

        {/* BANNER DE ERRO */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            background: '#fef2f2',
            border: '1px solid #fee2e2',
            color: '#b91c1c',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '1.5rem'
          }}>
            <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* FORMULÁRIO DE LOGIN */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* CAMPO DE E-MAIL */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="email" style={{ fontSize: '0.85rem', fontWeight: '600', color: '#27272a' }}>
              E-mail Corporativo
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail 
                size={18} 
                style={{ position: 'absolute', left: '12px', color: '#a1a1aa' }} 
              />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="Ex: rh@nodfy.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  paddingLeft: '38px',
                  width: '100%',
                  height: '42px',
                  fontSize: '0.9rem',
                  borderRadius: '8px',
                  border: '1px solid #d4d4d8',
                  background: '#fafafa'
                }}
              />
            </div>
          </div>

          {/* CAMPO DE SENHA */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="password" style={{ fontSize: '0.85rem', fontWeight: '600', color: '#27272a' }}>
                Senha de Acesso
              </label>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock 
                size={18} 
                style={{ position: 'absolute', left: '12px', color: '#a1a1aa' }} 
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  paddingLeft: '38px',
                  paddingRight: '38px',
                  width: '100%',
                  height: '42px',
                  fontSize: '0.9rem',
                  borderRadius: '8px',
                  border: '1px solid #d4d4d8',
                  background: '#fafafa'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#a1a1aa',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            
            {/* BOTÃO DE SUBMIT COM GRADIENTE */}
            <div className="btn-beam-container" style={{ width: '100%' }}>
              <div className="beam-border"></div>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{
                  width: '100%',
                  height: '42px',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  borderRadius: '8px',
                  background: 'var(--primary-gradient)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'opacity 0.2s'
                }}
              >
                {loading ? 'Validando Acesso...' : 'Entrar no Sistema'}
              </button>
            </div>

            {/* VOLTAR AO PORTAL */}
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              style={{
                width: '100%',
                height: '42px',
                fontSize: '0.9rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                border: '1px solid #d4d4d8',
                background: '#ffffff',
                color: '#27272a'
              }}
            >
              <ArrowLeft size={16} /> Voltar para Vagas
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}
