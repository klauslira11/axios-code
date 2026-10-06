import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, type QRCodeRecord } from './supabase';
import { getOrGenerateQRCodeImage } from './qrService';
import { Download, Edit2, Plus, Check, ExternalLink, X, AlertTriangle } from 'lucide-react';

export function App() {
  const [pathname, setPathname] = useState(window.location.pathname);

  // Estados Form Criar
  const [name, setName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Lista de QR Codes
  const [qrList, setQrList] = useState<(QRCodeRecord & { imageBase64?: string })[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');

  // Redirecionamento
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Lógica de Redirecionamento se a URL for /q/:id
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;

    if (pathname.startsWith('/q/')) {
      const id = pathname.replace('/q/', '').trim();
      if (id) {
        setRedirecting(true);
        supabase
          .from('qr_codes')
          .select('target_url')
          .eq('id', id)
          .single()
          .then(({ data, error }) => {
            if (error || !data) {
              setMsg({ type: 'error', text: 'QR Code não encontrado ou erro de redirecionamento.' });
              setRedirecting(false);
            } else {
              window.location.href = data.target_url;
            }
          });
      }
    }
  }, [pathname]);

  // Carregar todos os QR codes salvos
  const loadQRCodes = async () => {
    if (!supabase || !isSupabaseConfigured) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMsg({ type: 'error', text: `Erro no Supabase: ${error.message}. Certifique-se de executar o arquivo schema.sql no SQL Editor do Supabase.` });
    } else if (data) {
      const listWithImages = await Promise.all(
        data.map(async (item) => {
          const permUrl = `${window.location.origin}/q/${item.id}`;
          const img = await getOrGenerateQRCodeImage(item.id, permUrl);
          return { ...item, imageBase64: img };
        })
      );
      setQrList(listWithImages);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isSupabaseConfigured && !pathname.startsWith('/q/')) {
      loadQRCodes();
    }
  }, [pathname]);

  const isValidUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!supabase || !isSupabaseConfigured) {
      setMsg({ type: 'error', text: 'As variáveis do Supabase não foram configuradas na plataforma de hospedagem.' });
      return;
    }

    if (!name.trim()) {
      setMsg({ type: 'error', text: 'Por favor, informe o nome do QR Code.' });
      return;
    }

    if (!isValidUrl(targetUrl)) {
      setMsg({ type: 'error', text: 'Informe um link de destino HTTP ou HTTPS válido.' });
      return;
    }

    setLoading(true);

    const id = generateId();

    const newRecord = {
      id,
      name: name.trim(),
      target_url: targetUrl.trim(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('qr_codes').insert([newRecord]);

    if (error) {
      console.error('Erro no Supabase:', error);
      setMsg({ type: 'error', text: `Falha no Supabase: ${error.message}. Certifique-se de executar o arquivo schema.sql no SQL Editor do Supabase.` });
    } else {
      setMsg({ type: 'success', text: 'QR Code criado com sucesso!' });
      setName('');
      setTargetUrl('');
      loadQRCodes();
    }
    setLoading(false);
  };

  const handleUpdate = async (id: string) => {
    setMsg(null);

    if (!supabase || !isSupabaseConfigured) {
      setMsg({ type: 'error', text: 'Supabase não configurado.' });
      return;
    }

    if (!editName.trim()) {
      setMsg({ type: 'error', text: 'Informe o nome do QR Code.' });
      return;
    }

    if (!isValidUrl(editUrl)) {
      setMsg({ type: 'error', text: 'Informe um link HTTP ou HTTPS válido para atualizar.' });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('qr_codes')
      .update({
        name: editName.trim(),
        target_url: editUrl.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      setMsg({ type: 'error', text: `Erro ao atualizar QR Code: ${error.message}` });
    } else {
      setMsg({ type: 'success', text: 'QR Code atualizado com sucesso!' });
      setEditingId(null);
      setEditName('');
      setEditUrl('');
      loadQRCodes();
    }
    setLoading(false);
  };

  const handleDownload = (imageBase64: string, name: string) => {
    const link = document.createElement('a');
    link.href = imageBase64;
    link.download = `qrcode-${name.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="container" style={{ marginTop: '2rem' }}>
        <header>
          <h1>Gerenciador de QR Codes Dinâmicos</h1>
        </header>
        <div className="card" style={{ borderColor: 'var(--danger)', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <AlertTriangle size={48} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#f8fafc' }}>
            Configuração do Supabase Ausente
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
            O aplicativo precisa das variáveis de ambiente do Supabase cadastradas no painel da sua hospedagem (Netlify).
          </p>
          <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', textAlign: 'left', display: 'inline-block', fontSize: '0.85rem' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--accent)' }}>Cadastre na Netlify (Site settings &gt; Environment variables):</p>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)' }}>
              <li style={{ marginBottom: '0.25rem' }}><code>VITE_SUPABASE_URL</code></li>
              <li><code>VITE_SUPABASE_ANON_KEY</code></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (redirecting) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2>Redirecionando...</h2>
        <p style={{ color: 'var(--text-muted)' }}>Você está sendo encaminhado para o destino final.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <h1>Gerenciador de QR Codes Dinâmicos</h1>
        <p>Crie e modifique o destino de seus QR Codes a qualquer momento sem trocar a imagem.</p>
      </header>

      {msg && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {msg.text}
        </div>
      )}

      {/* Form de Criar QR Code */}
      <section className="card">
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Criar Novo QR Code</h2>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Nome do QR Code</label>
            <input
              type="text"
              placeholder="Ex: Cardápio do Restaurante, Campanha de Verão"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Link de Destino Atual</label>
            <input
              type="url"
              placeholder="https://exemplo.com/meu-link"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            <Plus size={18} /> {loading ? 'Criando...' : 'Criar QR Code'}
          </button>
        </form>
      </section>

      {/* Lista de QR Codes Salvos */}
      <section className="card">
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>QR Codes Salvos</h2>

        {qrList.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
            Nenhum QR Code encontrado. Crie o seu primeiro acima!
          </p>
        ) : (
          <div className="qr-list">
            {qrList.map((item) => {
              const permUrl = `${window.location.origin}/q/${item.id}`;
              const isEditing = editingId === item.id;

              return (
                <div className="qr-item" key={item.id}>
                  {item.imageBase64 && (
                    <div className="qr-img-container">
                      <img src={item.imageBase64} alt={`QR Code ${item.name}`} />
                    </div>
                  )}
                  <div className="qr-info">
                    {isEditing ? (
                      <div className="edit-form-full" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label>Nome do QR Code</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Nome do QR Code"
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label>Link de Destino</label>
                          <input
                            type="url"
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            placeholder="Novo link HTTP/HTTPS"
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button type="button" onClick={() => handleUpdate(item.id)} disabled={loading}>
                            <Check size={16} /> Salvar Alterações
                          </button>
                          <button type="button" className="secondary" onClick={() => setEditingId(null)}>
                            <X size={16} /> Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3>{item.name}</h3>
                        <div className="link-badge">
                          <strong>URL Permanente:</strong>{' '}
                          <a href={permUrl} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
                            {permUrl} <ExternalLink size={12} />
                          </a>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                          <strong>Destino Atual:</strong> {item.target_url}
                        </div>
                        <div className="qr-actions">
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => {
                              setEditingId(item.id);
                              setEditName(item.name);
                              setEditUrl(item.target_url);
                            }}
                          >
                            <Edit2 size={15} /> Editar QR Code
                          </button>
                          {item.imageBase64 && (
                            <button
                              type="button"
                              onClick={() => handleDownload(item.imageBase64!, item.name)}
                            >
                              <Download size={15} /> Baixar PNG
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
