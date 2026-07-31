import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, FileText, Check, Loader2 } from 'lucide-react';
import { databases, COLLECTIONS, DATABASE_ID, ID, Permission, Role, Query } from '../lib/appwrite';
import { mostrarToast } from './Toast';

export default function Notas({ user }) {
  const [notas, setNotas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [ativaId, setAtivaId] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(true);
  const debounceRef = useRef(null);

  // Carregar notas
  useEffect(() => {
    const carregar = async () => {
      if (!user) return;
      try {
        setCarregando(true);
        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.NOTAS,
          [Query.equal('userId', user.$id), Query.orderDesc('$updatedAt'), Query.limit(100)]
        );
        const mapped = res.documents.map(d => ({
          id: d.$id,
          titulo: d.titulo || 'Sem título',
          conteudo: d.conteudo || '',
          atualizadoEm: d.$updatedAt
        }));
        setNotas(mapped);
        if (mapped.length > 0) setAtivaId(mapped[0].id);
      } catch (error) {
        console.error('Erro ao carregar notas:', error);
        mostrarToast('Erro ao carregar notas.', 'erro');
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, [user]);

  const notaAtiva = notas.find(n => n.id === ativaId);

  // Salvar no Appwrite (debounced)
  const salvarNota = useCallback(async (id, titulo, conteudo) => {
    setSalvando(true);
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.NOTAS, id, { titulo, conteudo });
      setSalvo(true);
    } catch (error) {
      console.error('Erro ao salvar nota:', error);
      mostrarToast('Erro ao salvar nota.', 'erro');
    } finally {
      setSalvando(false);
    }
  }, []);

  // Autosave com debounce de 800ms
  const agendarSalvamento = useCallback((id, titulo, conteudo) => {
    setSalvo(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      salvarNota(id, titulo, conteudo);
    }, 800);
  }, [salvarNota]);

  const handleChange = (campo, valor) => {
    if (!notaAtiva) return;
    const atualizada = { ...notaAtiva, [campo]: valor };
    setNotas(prev => prev.map(n => n.id === ativaId ? atualizada : n));
    agendarSalvamento(ativaId, atualizada.titulo, atualizada.conteudo);
  };

  const criarNota = async () => {
    if (!user) return;
    try {
      const doc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.NOTAS,
        ID.unique(),
        { userId: user.$id, titulo: 'Nova nota', conteudo: '' },
        [
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id))
        ]
      );
      const nova = { id: doc.$id, titulo: doc.titulo, conteudo: doc.conteudo, atualizadoEm: doc.$updatedAt };
      setNotas(prev => [nova, ...prev]);
      setAtivaId(nova.id);
      mostrarToast('✅ Nota criada!');
    } catch (error) {
      console.error('Erro ao criar nota:', error);
      mostrarToast('Erro ao criar nota.', 'erro');
    }
  };

  const excluirNota = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta nota?')) return;
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.NOTAS, id);
      setNotas(prev => {
        const restantes = prev.filter(n => n.id !== id);
        if (ativaId === id) setAtivaId(restantes[0]?.id || null);
        return restantes;
      });
      mostrarToast('🗑️ Nota excluída!');
    } catch (error) {
      console.error('Erro ao excluir nota:', error);
      mostrarToast('Erro ao excluir nota.', 'erro');
    }
  };

  // Salvar imediatamente ao trocar de aba/fechar
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const formatarData = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  if (carregando) {
    return (
      <div className="animate-fade" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Loader2 size={28} className="spin" color="var(--text-muted)" />
      </div>
    );
  }

  return (
    <div className="animate-fade">
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Notas</h1>
          <p className="text-secondary">Anote o que precisar — tudo é salvo automaticamente</p>
        </div>
        <button className="btn btn-primary" onClick={criarNota}>
          <Plus size={16} /> Nova Nota
        </button>
      </div>

      {notas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <FileText size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Você ainda não tem nenhuma nota.</p>
          <button className="btn btn-primary" onClick={criarNota} style={{ margin: '0 auto' }}>
            <Plus size={16} /> Criar primeira nota
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, alignItems: 'start' }}>
          {/* Lista de notas */}
          <div className="card" style={{ padding: 8, maxHeight: 560, overflowY: 'auto' }}>
            {notas.map(n => (
              <div
                key={n.id}
                onClick={() => setAtivaId(n.id)}
                style={{
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                  background: n.id === ativaId ? 'var(--accent-blue)' : 'transparent',
                  color: n.id === ativaId ? '#fff' : 'var(--text-primary)',
                  transition: 'background 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {n.titulo || 'Sem título'}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); excluirNota(n.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0, opacity: 0.7 }}
                  >
                    <Trash2 size={13} color={n.id === ativaId ? '#fff' : 'var(--accent-red)'} />
                  </button>
                </div>
                <div style={{ fontSize: 11, marginTop: 2, opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {n.conteudo ? n.conteudo.slice(0, 40) : 'Vazia'}
                </div>
              </div>
            ))}
          </div>

          {/* Editor */}
          {notaAtiva && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
                <input
                  className="input"
                  style={{ fontSize: 16, fontWeight: 700, border: 'none', background: 'transparent', padding: 0, flex: 1 }}
                  value={notaAtiva.titulo}
                  onChange={e => handleChange('titulo', e.target.value)}
                  placeholder="Título da nota"
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {salvando ? (
                    <><Loader2 size={13} className="spin" /> Salvando...</>
                  ) : salvo ? (
                    <><Check size={13} color="var(--accent-green)" /> Salvo</>
                  ) : (
                    <>Editando...</>
                  )}
                </div>
              </div>
              <textarea
                className="input"
                style={{ width: '100%', minHeight: 400, resize: 'vertical', lineHeight: 1.6, fontSize: 14, fontFamily: 'inherit' }}
                value={notaAtiva.conteudo}
                onChange={e => handleChange('conteudo', e.target.value)}
                placeholder="Comece a escrever aqui..."
              />
              {notaAtiva.atualizadoEm && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'right' }}>
                  Última atualização: {formatarData(notaAtiva.atualizadoEm)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
