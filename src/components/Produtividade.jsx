import { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Clock, Circle, Edit2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, ReferenceLine } from 'recharts';
import { databases, COLLECTIONS, DATABASE_ID, ID, Permission, Role, Query } from '../lib/appwrite';
import { mostrarToast } from './Toast';

const CATEGORIAS = ['Trabalho', 'Pessoal', 'Saúde', 'Estudos', 'Financeiro'];
const PRIORIDADES = ['Alta', 'Média', 'Baixa'];
const STATUS_LIST = ['Pendente', 'Em andamento', 'Concluída'];

const priorColor = { Alta: '#ef4444', Média: '#f59e0b', Baixa: '#10b981' };
const statusIcon = { Pendente: Circle, 'Em andamento': Clock, Concluída: CheckCircle };
const statusColor = { Pendente: '#64748b', 'Em andamento': '#f59e0b', Concluída: '#10b981' };

export default function Produtividade({ tarefas, setTarefas, habitos, setHabitos, aproveitamentoMensal, setAproveitamentoMensal, user }) {
  const [carregando, setCarregando] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [showAprovForm, setShowAprovForm] = useState(false);
  const [aprovFilter, setAprovFilter] = useState(6);
  const [aprovForm, setAprovForm] = useState({ id: null, mesAno: '', aproveitamento: '', observacoes: '' });
  const [activeFilter, setActiveFilter] = useState('Todas');
  const [form, setForm] = useState({
    titulo: '', categoria: 'Trabalho', prioridade: 'Média',
    status: 'Pendente', tempoEstimado: '', tempoReal: '',
    data: new Date().toISOString().split('T')[0]
  });

  const hoje = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const temDadosFalsosTarefas = tarefas.some(t => !t.$id);
    const temDadosFalsosAprov = aproveitamentoMensal.some(a => !a.$id);
    
    if (temDadosFalsosTarefas || temDadosFalsosAprov) {
      console.warn('⚠️ Dados hardcoded detectados em produtividade — limpando e buscando do Appwrite');
      if (temDadosFalsosTarefas) setTarefas([]);
      if (temDadosFalsosAprov) setAproveitamentoMensal([]);
      if (user?.$id) carregarDados(user.$id);
    }
  }, [tarefas, aproveitamentoMensal, user]);

  useEffect(() => {
    if (user?.$id) {
      carregarDados(user.$id);
    }
  }, [user]);

  const carregarDados = async (userId) => {
    setCarregando(true);
    try {
      const [resProd, resAprov] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUTIVIDADE, [Query.equal('userId', userId), Query.limit(500)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.APROVEITAMENTO, [Query.equal('userId', userId), Query.limit(100)])
      ]);

      const todasTarefas = [];

      resProd.documents.forEach(doc => {
        todasTarefas.push({
          ...doc,
          id: doc.$id,
          tarefa: doc.tarefa, titulo: doc.tarefa,
          categoria: doc.categoria || 'Trabalho',
          prioridade: doc.prioridade || 'Média',
          status: doc.status || 'Pendente',
          tempoEstimado: doc.tempoEstimado || 0,
          tempoReal: doc.tempoReal || 0,
          data: doc.data || hoje
        });
      });

      setTarefas(todasTarefas);
      
      const mappedAprov = resAprov.documents.map(d => ({
        ...d,
        id: d.$id,
        mesAno: d.mesAno,
        aproveitamento: d.aproveitamento,
        observacoes: d.observacoes || ''
      }));
      setAproveitamentoMensal(mappedAprov);

    } catch (error) {
      console.error('Erro ao buscar produtividade:', error);
      mostrarToast('Erro ao carregar dados de produtividade.', 'erro');
    } finally {
      setCarregando(false);
    }
  };

  const handleAdd = async () => {
    if (!form.titulo) return;
    try {
      console.log('📤 [Appwrite] Criando tarefa:', form.titulo);
      const dadosTarefa = {
        userId: user.$id,
        tarefa: form.titulo,
        categoria: form.categoria,
        prioridade: form.prioridade,
        status: form.status,
        data: form.data,
        tempoEstimado: form.tempoEstimado !== '' && form.tempoEstimado != null ? parseInt(form.tempoEstimado) : 0,
        tempoReal: form.tempoReal !== '' && form.tempoReal != null ? parseInt(form.tempoReal) : 0
      };
      const doc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUTIVIDADE,
        ID.unique(),
        dadosTarefa,
        [
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id))
        ]
      );
      console.log('✅ [Appwrite] Tarefa criada:', doc.$id);
      setTarefas(prev => [...prev, { 
        ...doc, 
        id: doc.$id,
        tarefa: doc.tarefa, titulo: doc.tarefa,
        categoria: doc.categoria,
        prioridade: doc.prioridade,
        status: doc.status,
        data: doc.data,
        tempoEstimado: doc.tempoEstimado,
        tempoReal: doc.tempoReal
      }]);
      setForm({ titulo: '', categoria: 'Trabalho', prioridade: 'Média', status: 'Pendente', tempoEstimado: '', tempoReal: '', data: hoje });
      setShowForm(false);
      mostrarToast('✅ Tarefa salva com sucesso!');
    } catch (error) {
      console.error('❌ [Appwrite] Falha ao criar tarefa:', error);
      mostrarToast('❌ Erro ao salvar tarefa.', 'erro');
    }
  };

  const handleDelete = async (id) => {
    try {
      console.log('📤 [Appwrite] Excluindo tarefa:', id);
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.PRODUTIVIDADE, id);
      console.log('✅ [Appwrite] Tarefa excluída:', id);
      setTarefas(prev => prev.filter(t => t.id !== id));
      mostrarToast('🗑️ Tarefa excluída!');
    } catch (error) {
      console.error('❌ [Appwrite] Erro ao excluir tarefa:', error);
      mostrarToast('❌ Erro ao excluir tarefa.', 'erro');
    }
  };

  const cycleStatus = async (id) => {
    const tarefa = tarefas.find(t => t.id === id);
    if (!tarefa) return;
    const next = { Pendente: 'Em andamento', 'Em andamento': 'Concluída', Concluída: 'Pendente' };
    const newStatus = next[tarefa.status];
    
    try {
      console.log('📤 [Appwrite] Atualizando status tarefa:', id, newStatus);
      const doc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.PRODUTIVIDADE, id, { status: newStatus });
      console.log('✅ [Appwrite] Status atualizado:', id);
      setTarefas(prev => prev.map(t => t.id === id ? { ...t, status: doc.status } : t));
    } catch (error) {
      console.error('❌ [Appwrite] Erro ao atualizar status:', error);
      mostrarToast('❌ Erro ao atualizar status.', 'erro');
    }
  };

  const handleAddAprov = async () => {
    if (!aprovForm.mesAno) return;
    const val = parseFloat(aprovForm.aproveitamento);
    if (isNaN(val) || val < 0 || val > 100) {
      alert('O aproveitamento deve ser um número entre 0 e 100.');
      return;
    }
    if (aproveitamentoMensal.some(a => a.mesAno === aprovForm.mesAno && a.id !== aprovForm.id)) {
      alert('Este mês já está cadastrado.');
      return;
    }

    try {
      if (aprovForm.id) {
        console.log('📤 [Appwrite] Atualizando aprov:', aprovForm.id);
        const doc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.APROVEITAMENTO, aprovForm.id, {
          mesAno: aprovForm.mesAno,
          aproveitamento: val,
          observacoes: aprovForm.observacoes || null
        });
        console.log('✅ [Appwrite] Aprov atualizado:', doc.$id);
        setAproveitamentoMensal(prev => prev.map(a => a.id === aprovForm.id ? { ...doc, id: doc.$id } : a));
        mostrarToast('✅ Aproveitamento atualizado!');
      } else {
        console.log('📤 [Appwrite] Criando aprov:', aprovForm.mesAno);
        const doc = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.APROVEITAMENTO,
          ID.unique(),
          {
            userId: user.$id,
            mesAno: aprovForm.mesAno,
            aproveitamento: val,
            observacoes: aprovForm.observacoes || null
          },
          [
            Permission.read(Role.user(user.$id)),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id))
          ]
        );
        console.log('✅ [Appwrite] Aprov criado:', doc.$id);
        setAproveitamentoMensal(prev => [...prev, { ...doc, id: doc.$id }]);
        mostrarToast('✅ Aproveitamento salvo com sucesso!');
      }
      setAprovForm({ id: null, mesAno: '', aproveitamento: '', observacoes: '' });
      setShowAprovForm(false);
    } catch (error) {
      console.error('❌ [Appwrite] Erro em Aproveitamento:', error);
      mostrarToast('❌ Erro ao salvar aproveitamento.', 'erro');
    }
  };

  const handleEditAprov = (item) => {
    setAprovForm({ ...item, aproveitamento: item.aproveitamento.toString() });
    setShowAprovForm(true);
  };

  const handleDeleteAprov = async (id) => {
    if (window.confirm('Excluir este registro?')) {
      try {
        console.log('📤 [Appwrite] Excluindo aprov:', id);
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.APROVEITAMENTO, id);
        console.log('✅ [Appwrite] Aprov excluído:', id);
        setAproveitamentoMensal(prev => prev.filter(a => a.id !== id));
        mostrarToast('🗑️ Registro excluído!');
      } catch (error) {
        console.error('❌ [Appwrite] Erro ao excluir aprov:', error);
        mostrarToast('❌ Erro ao excluir registro.', 'erro');
      }
    }
  };

  const filtered = useMemo(() => {
    if (activeFilter === 'Todas') return tarefas;
    if (activeFilter === 'Hoje') return tarefas.filter(t => t.data === hoje);
    return tarefas.filter(t => t.status === activeFilter || t.categoria === activeFilter);
  }, [tarefas, activeFilter, hoje]);

  const concluidas = tarefas.filter(t => t.status === 'Concluída');
  const taxaConclusao = tarefas.length > 0 ? (concluidas.length / tarefas.length) * 100 : 0;
  const streakMax = 0;
  const tempoTotal = concluidas.reduce((s, t) => s + (t.tempoReal || t.tempoEstimado), 0);
  const hojeCompletas = tarefas.filter(t => t.data === hoje && t.status === 'Concluída').length;

  const catData = useMemo(() => CATEGORIAS.map(cat => ({
    name: cat,
    concluidas: tarefas.filter(t => t.categoria === cat && t.status === 'Concluída').length,
    pendentes: tarefas.filter(t => t.categoria === cat && t.status !== 'Concluída').length,
  })), [tarefas]);

  const aprovData = useMemo(() => [...aproveitamentoMensal].sort((a, b) => {
    // Ordenar cronologicamente se possível, ou por ID
    return a.id > b.id ? 1 : -1;
  }), [aproveitamentoMensal]);
  
  const aprovStats = useMemo(() => {
    if (!aprovData.length) return null;
    const len = aprovData.length;
    const current = aprovData[len - 1];
    
    const last3 = aprovData.slice(-3);
    const avg3 = last3.reduce((s, a) => s + a.aproveitamento, 0) / last3.length;
    
    const last6 = aprovData.slice(-6);
    const avg6 = last6.reduce((s, a) => s + a.aproveitamento, 0) / last6.length;
    
    const best = aprovData.reduce((a, b) => b.aproveitamento > a.aproveitamento ? b : a);
    
    const trend = len >= 2 ? (aprovData[len-1].aproveitamento > aprovData[len-2].aproveitamento ? '↗' : aprovData[len-1].aproveitamento < aprovData[len-2].aproveitamento ? '↘' : '→') : '→';
    
    return { current: current.aproveitamento, avg3, avg6, best, trend };
  }, [aprovData]);

  const filteredAprovData = useMemo(() => aprovData.slice(-aprovFilter), [aprovData, aprovFilter]);
  
  const avgFilteredAprov = useMemo(() => {
    if (!filteredAprovData.length) return 0;
    return filteredAprovData.reduce((s, a) => s + a.aproveitamento, 0) / filteredAprovData.length;
  }, [filteredAprovData]);

  if (carregando) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" style={{ borderBottomColor: 'transparent' }} />
        <span className="text-muted">Carregando produtividade...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      <div className="section-header mb-4">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Produtividade</h1>
          <p className="text-secondary">{hojeCompletas} tarefas concluídas hoje</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Nova Tarefa
        </button>
      </div>

      {/* Cards de métricas */}
      <div className="grid-4 mb-6">
        {[
          { label: 'Concluídas', value: concluidas.length, color: 'var(--accent-green)', icon: '✅' },
          { label: 'Taxa Conclusão', value: `${taxaConclusao.toFixed(0)}%`, color: 'var(--accent-blue)', icon: '📊' },
          { label: 'Horas Produtivas', value: `${(tempoTotal / 60).toFixed(1)}h`, color: 'var(--accent-purple)', icon: '⏱️' },
          { label: 'Total de Tarefas', value: tarefas.length, color: 'var(--accent-yellow)', icon: '📋' },
        ].map(m => (
          <div key={m.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{m.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.value}</div>
            <div className="text-muted text-xs">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Gráfico de Tarefas por Categoria */}
      <div className="mb-6">
        <div className="card">
          <div className="section-title mb-3">Tarefas por Categoria</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={catData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="concluidas" name="Concluídas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pendentes" name="Pendentes" fill="#64748b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Form de nova tarefa */}
      {showForm && (
        <div className="card mb-4 animate-fade" style={{ borderColor: 'var(--accent-blue)' }}>
          <div className="section-title mb-3">Nova Tarefa</div>
          <div className="form-row">
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="label">Título</label>
              <input className="input" placeholder="Descreva a tarefa..." value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Categoria</label>
              <select className="input" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Prioridade</label>
              <select className="input" value={form.prioridade} onChange={e => setForm({ ...form, prioridade: e.target.value })}>
                {PRIORIDADES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Data</label>
              <input type="date" className="input" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Tempo Est. (min) <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span></label>
              <input type="number" className="input" placeholder="Deixe em branco se não souber" value={form.tempoEstimado} onChange={e => setForm({ ...form, tempoEstimado: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Tempo Real (min) <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span></label>
              <input type="number" className="input" placeholder="Preencha após concluir" value={form.tempoReal} onChange={e => setForm({ ...form, tempoReal: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="btn btn-primary" onClick={handleAdd}>Salvar</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Filtros de tarefas */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['Todas', 'Hoje', 'Pendente', 'Em andamento', 'Concluída', ...CATEGORIAS].map(f => (
          <button key={f} className={`tab-btn ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {/* Lista de tarefas */}
      <div className="card">
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Nenhuma tarefa encontrada</div>
        )}
        {filtered.map(t => {
          const StatusIcon = statusIcon[t.status] || Circle;
          return (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
              borderBottom: '1px solid var(--border)', opacity: t.status === 'Concluída' ? 0.7 : 1
            }}>
              <button
                onClick={() => cycleStatus(t.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: statusColor[t.status], padding: 0, flexShrink: 0 }}
              >
                <StatusIcon size={20} />
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 500, fontSize: 14,
                  textDecoration: t.status === 'Concluída' ? 'line-through' : 'none',
                  color: t.status === 'Concluída' ? 'var(--text-muted)' : 'var(--text-primary)'
                }}>{t.titulo || t.tarefa}</div>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <span className="badge badge-gray" style={{ fontSize: 10 }}>{t.categoria}</span>
                  <span className="badge" style={{ fontSize: 10, background: `${priorColor[t.prioridade]}22`, color: priorColor[t.prioridade] }}>{t.prioridade}</span>
                  {t.data && <span className="text-muted text-xs">{t.data.split('-').reverse().join('/')}</span>}
                  {t.tempoEstimado > 0 && <span className="text-muted text-xs">⏱️ {t.tempoEstimado}min</span>}
                </div>
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(t.id)}>
                <Trash2 size={14} color="var(--accent-red)" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Seção Aproveitamento Mensal */}
      <div className="section-header mt-8 mb-4">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Aproveitamento Mensal</h2>
          <p className="text-secondary">Monitore sua performance ao longo do tempo</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setAprovForm({ id: null, mesAno: '', aproveitamento: '', observacoes: '' }); setShowAprovForm(true); }}>
          <Plus size={16} /> Adicionar Novo Mês
        </button>
      </div>

      {showAprovForm && (
        <div className="card mb-4 animate-fade" style={{ borderColor: 'var(--accent-purple)' }}>
          <div className="section-title mb-3">{aprovForm.id ? 'Editar Mês' : 'Novo Mês'}</div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Mês/Ano</label>
              <input className="input" placeholder="Ex: Jun/2026" value={aprovForm.mesAno} onChange={e => setAprovForm({ ...aprovForm, mesAno: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Aproveitamento (%)</label>
              <input type="number" className="input" placeholder="0 a 100" min="0" max="100" value={aprovForm.aproveitamento} onChange={e => setAprovForm({ ...aprovForm, aproveitamento: e.target.value })} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="label">Observações</label>
              <input className="input" placeholder="Notas sobre este mês..." value={aprovForm.observacoes} onChange={e => setAprovForm({ ...aprovForm, observacoes: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="btn btn-primary" onClick={handleAddAprov}>Salvar</button>
            <button className="btn btn-ghost" onClick={() => setShowAprovForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {aprovStats && (
        <div className="grid-5 mb-6" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: aprovStats.current >= 80 ? 'var(--accent-green)' : aprovStats.current >= 60 ? 'var(--accent-yellow)' : 'var(--accent-red)' }}>
              {aprovStats.current}%
            </div>
            <div className="text-muted text-xs mt-1">Mês Atual</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-blue)' }}>{aprovStats.avg3.toFixed(1)}%</div>
            <div className="text-muted text-xs mt-1">Média 3 Meses</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-purple)' }}>{aprovStats.avg6.toFixed(1)}%</div>
            <div className="text-muted text-xs mt-1">Média 6 Meses</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-green)' }}>{aprovStats.best.mesAno}</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{aprovStats.best.aproveitamento}%</div>
            <div className="text-muted text-xs">Melhor Mês</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: aprovStats.trend === '↗' ? 'var(--accent-green)' : aprovStats.trend === '↘' ? 'var(--accent-red)' : 'var(--accent-yellow)' }}>
              {aprovStats.trend === '↗' ? <TrendingUp size={28} /> : aprovStats.trend === '↘' ? <TrendingDown size={28} /> : <Minus size={28} />}
            </div>
            <div className="text-muted text-xs mt-1">Tendência</div>
          </div>
        </div>
      )}

      <div className="grid-2 mb-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div className="section-title">Evolução de Aproveitamento</div>
            <select className="input" style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }} value={aprovFilter} onChange={e => setAprovFilter(Number(e.target.value))}>
              <option value={3}>3 meses</option>
              <option value={6}>6 meses</option>
              <option value={12}>12 meses</option>
            </select>
          </div>
          
          {filteredAprovData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={filteredAprovData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mesAno" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={v => [`${v}%`, 'Aproveitamento']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <ReferenceLine y={avgFilteredAprov} stroke="var(--text-muted)" strokeDasharray="3 3" label={{ position: 'top', value: 'Média', fill: 'var(--text-muted)', fontSize: 10 }} />
                <Line type="monotone" dataKey="aproveitamento" stroke="#8b5cf6" strokeWidth={3} dot={({ cx, cy, payload }) => {
                  const color = payload.aproveitamento >= 80 ? '#10b981' : payload.aproveitamento >= 60 ? '#f59e0b' : '#ef4444';
                  return <circle key={`dot-${payload.id}`} cx={cx} cy={cy} r={6} fill={color} stroke="var(--bg-card)" strokeWidth={2} />;
                }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Sem dados suficientes</div>
          )}
        </div>

        <div className="card" style={{ overflowY: 'auto', maxHeight: '330px' }}>
          <div className="section-title mb-4">Histórico</div>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '8px 4px', fontSize: 12, color: 'var(--text-muted)' }}>Mês/Ano</th>
                <th style={{ padding: '8px 4px', fontSize: 12, color: 'var(--text-muted)' }}>Aprov.</th>
                <th style={{ padding: '8px 4px', fontSize: 12, color: 'var(--text-muted)' }}>Observações</th>
                <th style={{ padding: '8px 4px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {aprovData.slice().reverse().map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '12px 4px', fontSize: 13, fontWeight: 500 }}>{item.mesAno}</td>
                  <td style={{ padding: '12px 4px' }}>
                    <span className="badge" style={{ 
                      background: item.aproveitamento >= 80 ? 'rgba(16,185,129,0.1)' : item.aproveitamento >= 60 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                      color: item.aproveitamento >= 80 ? 'var(--accent-green)' : item.aproveitamento >= 60 ? 'var(--accent-yellow)' : 'var(--accent-red)'
                    }}>
                      {item.aproveitamento}%
                    </span>
                  </td>
                  <td style={{ padding: '12px 4px', fontSize: 12, color: 'var(--text-secondary)' }}>{item.observacoes || '-'}</td>
                  <td style={{ padding: '12px 4px', textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleEditAprov(item)} style={{ marginRight: 4 }}>
                      <Edit2 size={14} color="var(--accent-blue)" />
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDeleteAprov(item.id)}>
                      <Trash2 size={14} color="var(--accent-red)" />
                    </button>
                  </td>
                </tr>
              ))}
              {aprovData.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: 13 }}>Nenhum mês cadastrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}