import { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/helpers';
import { databases, COLLECTIONS, DATABASE_ID, ID, Permission, Role, Query } from '../lib/appwrite';

const metaColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#f97316', '#06b6d4'];

function CalculadoraJuros() {
  const [v, setV] = useState({ capital: '', taxa: '', meses: '' });
  const resultado = useMemo(() => {
    if (!v.capital || !v.taxa || !v.meses) return null;
    const montante = parseFloat(v.capital) * Math.pow(1 + parseFloat(v.taxa) / 100, parseFloat(v.meses));
    return { montante, juros: montante - parseFloat(v.capital) };
  }, [v]);

  return (
    <div className="card">
      <div className="section-title mb-3">📊 Juros Compostos</div>
      <div className="form-group">
        <label className="label">Capital inicial (R$)</label>
        <input type="number" className="input" value={v.capital} onChange={e => setV({ ...v, capital: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="label">Taxa mensal (%)</label>
        <input type="number" className="input" step="0.01" value={v.taxa} onChange={e => setV({ ...v, taxa: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="label">Período (meses)</label>
        <input type="number" className="input" value={v.meses} onChange={e => setV({ ...v, meses: e.target.value })} />
      </div>
      {resultado && (
        <div style={{ padding: 12, background: 'rgba(59,130,246,0.1)', borderRadius: 8, marginTop: 8 }}>
          <div className="stat-row" style={{ paddingTop: 0 }}>
            <span className="text-muted text-xs">Montante final</span>
            <strong style={{ color: 'var(--accent-blue)' }}>{formatCurrency(resultado.montante)}</strong>
          </div>
          <div className="stat-row">
            <span className="text-muted text-xs">Juros gerados</span>
            <strong style={{ color: 'var(--accent-green)' }}>{formatCurrency(resultado.juros)}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

function SimuladorInvestimento() {
  const [v, setV] = useState({ aporte: '', aporteMensal: '', taxa: '', meses: '' });
  const resultado = useMemo(() => {
    if (!v.taxa || !v.meses) return null;
    const r = parseFloat(v.taxa) / 100;
    const n = parseFloat(v.meses);
    const P = parseFloat(v.aporte) || 0;
    const M = parseFloat(v.aporteMensal) || 0;
    const montante = P * Math.pow(1 + r, n) + (r > 0 ? M * ((Math.pow(1 + r, n) - 1) / r) : M * n);
    const totalInvestido = P + M * n;
    return { montante, juros: montante - totalInvestido, totalInvestido };
  }, [v]);

  return (
    <div className="card">
      <div className="section-title mb-3">💰 Simulador de Investimento</div>
      <div className="form-group">
        <label className="label">Aporte inicial (R$)</label>
        <input type="number" className="input" value={v.aporte} onChange={e => setV({ ...v, aporte: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="label">Aporte mensal (R$)</label>
        <input type="number" className="input" value={v.aporteMensal} onChange={e => setV({ ...v, aporteMensal: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="label">Taxa mensal (%)</label>
        <input type="number" className="input" step="0.01" value={v.taxa} onChange={e => setV({ ...v, taxa: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="label">Período (meses)</label>
        <input type="number" className="input" value={v.meses} onChange={e => setV({ ...v, meses: e.target.value })} />
      </div>
      {resultado && (
        <div style={{ padding: 12, background: 'rgba(16,185,129,0.1)', borderRadius: 8, marginTop: 8 }}>
          <div className="stat-row" style={{ paddingTop: 0 }}>
            <span className="text-muted text-xs">Total investido</span>
            <span>{formatCurrency(resultado.totalInvestido)}</span>
          </div>
          <div className="stat-row">
            <span className="text-muted text-xs">Rendimento</span>
            <strong style={{ color: 'var(--accent-green)' }}>{formatCurrency(resultado.juros)}</strong>
          </div>
          <div className="stat-row">
            <span className="text-muted text-xs">Montante final</span>
            <strong style={{ color: 'var(--accent-blue)', fontSize: 15 }}>{formatCurrency(resultado.montante)}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

function SimuladorAposentadoria() {
  const [v, setV] = useState({ idadeAtual: '', idadeMeta: '', patrimonioAtual: '', aporteMensal: '', rentabilidade: '' });
  const resultado = useMemo(() => {
    if (!v.idadeAtual || !v.idadeMeta || !v.rentabilidade) return null;
    const anos = parseFloat(v.idadeMeta) - parseFloat(v.idadeAtual);
    if (anos <= 0) return null;
    const meses = anos * 12;
    const r = parseFloat(v.rentabilidade) / 100 / 12;
    const P = parseFloat(v.patrimonioAtual) || 0;
    const M = parseFloat(v.aporteMensal) || 0;
    const montante = P * Math.pow(1 + r, meses) + (r > 0 ? M * ((Math.pow(1 + r, meses) - 1) / r) : M * meses);
    const rendaMensal = montante * r * 0.8;
    return { montante, rendaMensal, anos };
  }, [v]);

  return (
    <div className="card">
      <div className="section-title mb-3">🏖️ Simulador de Aposentadoria</div>
      <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="form-group">
          <label className="label">Idade atual</label>
          <input type="number" className="input" value={v.idadeAtual} onChange={e => setV({ ...v, idadeAtual: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="label">Idade alvo</label>
          <input type="number" className="input" value={v.idadeMeta} onChange={e => setV({ ...v, idadeMeta: e.target.value })} />
        </div>
      </div>
      <div className="form-group">
        <label className="label">Patrimônio atual (R$)</label>
        <input type="number" className="input" value={v.patrimonioAtual} onChange={e => setV({ ...v, patrimonioAtual: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="label">Aporte mensal (R$)</label>
        <input type="number" className="input" value={v.aporteMensal} onChange={e => setV({ ...v, aporteMensal: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="label">Rentabilidade anual (%)</label>
        <input type="number" className="input" step="0.1" value={v.rentabilidade} onChange={e => setV({ ...v, rentabilidade: e.target.value })} />
      </div>
      {resultado && (
        <div style={{ padding: 12, background: 'rgba(139,92,246,0.1)', borderRadius: 8, marginTop: 8 }}>
          <div className="stat-row" style={{ paddingTop: 0 }}>
            <span className="text-muted text-xs">Prazo</span>
            <span>{resultado.anos} anos</span>
          </div>
          <div className="stat-row">
            <span className="text-muted text-xs">Patrimônio na aposent.</span>
            <strong style={{ color: 'var(--accent-purple)' }}>{formatCurrency(resultado.montante)}</strong>
          </div>
          <div className="stat-row">
            <span className="text-muted text-xs">Renda passiva est.</span>
            <strong style={{ color: 'var(--accent-green)', fontSize: 15 }}>{formatCurrency(resultado.rendaMensal)}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Metas({ metas, setMetas, receitas, despesas, user }) {
  const [showForm, setShowForm] = useState(false);
  const [carregandoMetas, setCarregandoMetas] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nome: '', valorAlvo: '', prazo: '', acumulado: '', descricao: '' });

  useEffect(() => {
    const buscarMetas = async () => {
      try {
        setCarregandoMetas(true);
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.METAS,
          [Query.equal('userId', user.$id)]
        );
        const mapped = response.documents.map(m => ({
          ...m,
          id: m.$id,
          nome: m.nome,
          valorAlvo: m.valorAlvo,
          prazo: m.prazo ? m.prazo.split('T')[0] : '',
          acumulado: m.valorAcumulado,
          descricao: m.categoria || ''
        }));
        setMetas(mapped);
      } catch (error) {
        console.error('Erro ao buscar metas:', error);
      } finally {
        setCarregandoMetas(false);
      }
    };
    if (user) buscarMetas();
  }, [user, setMetas]);

  const saldoMensal = useMemo(() => {
    const totalReceitas = receitas.reduce((s, r) => s + r.valor, 0);
    const totalDespesas = despesas.reduce((s, d) => s + d.valor, 0);
    const meses = new Set([...receitas, ...despesas].map(i => i.data?.slice(0, 7))).size;
    return (totalReceitas - totalDespesas) / Math.max(1, meses);
  }, [receitas, despesas]);

  const handleOpenForm = (meta = null) => {
    if (meta) {
      setEditingId(meta.id);
      setForm({ ...meta, valorAlvo: meta.valorAlvo.toString(), acumulado: meta.acumulado.toString() });
    } else {
      setEditingId(null);
      setForm({ nome: '', valorAlvo: '', prazo: '', acumulado: '', descricao: '' });
    }
    setShowForm(true);
  };

  const handleAdd = async () => {
    if (!form.nome || !form.valorAlvo || !form.prazo) return;
    try {
      if (editingId) {
        const doc = await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.METAS,
          editingId,
          {
            nome: form.nome,
            valorAlvo: parseFloat(form.valorAlvo),
            prazo: new Date(form.prazo).toISOString(),
            valorAcumulado: parseFloat(form.acumulado) || 0,
            categoria: form.descricao || null
          }
        );
        const updated = {
          ...doc, id: doc.$id, nome: doc.nome, valorAlvo: doc.valorAlvo,
          prazo: doc.prazo ? doc.prazo.split('T')[0] : '',
          acumulado: doc.valorAcumulado, descricao: doc.categoria || ''
        };
        setMetas(prev => prev.map(m => m.id === editingId ? updated : m));
      } else {
        const doc = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.METAS,
          ID.unique(),
          {
            userId: user.$id,
            nome: form.nome,
            valorAlvo: parseFloat(form.valorAlvo),
            prazo: new Date(form.prazo).toISOString(),
            valorAcumulado: parseFloat(form.acumulado) || 0,
            categoria: form.descricao || null,
            ativa: true
          },
          [
            Permission.read(Role.user(user.$id)),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id))
          ]
        );
        const novo = {
          ...doc, id: doc.$id, nome: doc.nome, valorAlvo: doc.valorAlvo,
          prazo: doc.prazo ? doc.prazo.split('T')[0] : '',
          acumulado: doc.valorAcumulado, descricao: doc.categoria || ''
        };
        setMetas(prev => [...prev, novo]);
      }
      setShowForm(false);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar meta.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja excluir esta meta?")) {
      try {
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.METAS, id);
        setMetas(prev => prev.filter(m => m.id !== id));
      } catch (e) {
        console.error(e);
        alert('Erro ao excluir meta.');
      }
    }
  };

  const handleUpdateAcumulado = async (id, value) => {
    const novoValor = parseFloat(value) || 0;
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.METAS,
        id,
        { valorAcumulado: novoValor }
      );
      setMetas(prev => prev.map(m => m.id === id ? { ...m, acumulado: novoValor } : m));
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar acumulado.');
    }
  };

  const calcMeta = (meta) => {
    const prazo = new Date(meta.prazo);
    const agora = new Date();
    const mesesRestantes = Math.max(1, Math.ceil((prazo - agora) / (1000 * 60 * 60 * 24 * 30)));
    const falta = Math.max(0, meta.valorAlvo - meta.acumulado);
    const porMes = falta / mesesRestantes;
    const pct = meta.valorAlvo > 0 ? Math.min(100, (meta.acumulado / meta.valorAlvo) * 100) : 0;
    return { mesesRestantes, porMes, pct, falta };
  };

  if (carregandoMetas) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" style={{ borderBottomColor: 'transparent' }} />
        <span className="text-muted">Carregando metas...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      <div className="section-header mb-4">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Metas Financeiras</h1>
          <p className="text-secondary">Saldo disponível: <strong style={{ color: 'var(--accent-green)' }}>{formatCurrency(Math.max(0, saldoMensal))}/mês</strong></p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenForm()}>
          <Plus size={16} /> Nova Meta
        </button>
      </div>

      {showForm && (
        <div className="card mb-4 animate-fade" style={{ borderColor: 'var(--accent-blue)' }}>
          <div className="section-title mb-3">{editingId ? 'Editar Meta' : 'Nova Meta'}</div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Nome da Meta</label>
              <input className="input" placeholder="Ex: Viagem Europa" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Valor Alvo (R$)</label>
              <input type="number" className="input" value={form.valorAlvo} onChange={e => setForm({ ...form, valorAlvo: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Prazo</label>
              <input type="date" className="input" value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Já Acumulado (R$)</label>
              <input type="number" className="input" value={form.acumulado} onChange={e => setForm({ ...form, acumulado: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Descrição</label>
              <input className="input" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="btn btn-primary" onClick={handleAdd}>Salvar</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {metas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          <p>Nenhuma meta cadastrada. Comece agora!</p>
          <button className="btn btn-primary mt-2" onClick={() => handleOpenForm()}>+ Adicionar Meta</button>
        </div>
      ) : (
        <div className="grid-2 mb-6">
          {metas.map((meta, idx) => {
            const { mesesRestantes, porMes, pct, falta } = calcMeta(meta);
            const concluida = pct >= 100;
            const color = metaColors[idx % metaColors.length];
            const viavel = porMes <= saldoMensal;

            return (
              <div key={meta.id} className="card" style={{ borderTop: `3px solid ${color}` }}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{meta.nome}</div>
                    {meta.descricao && <div className="text-muted text-xs mt-1">{meta.descricao}</div>}
                  </div>
                  <div className="flex gap-2">
                    {concluida && <span className="badge badge-green">✓ Atingida!</span>}
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleOpenForm(meta)}>
                      <Edit2 size={14} color="var(--accent-blue)" />
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(meta.id)}>
                      <Trash2 size={14} color="var(--accent-red)" />
                    </button>
                  </div>
                </div>

                <div className="grid-2 mb-3" style={{ gap: 10 }}>
                  <div style={{ padding: 10, background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color, fontSize: 14 }}>{formatCurrency(meta.acumulado)}</div>
                    <div className="text-xs text-muted">Acumulado</div>
                  </div>
                  <div style={{ padding: 10, background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{formatCurrency(meta.valorAlvo)}</div>
                    <div className="text-xs text-muted">Meta</div>
                  </div>
                </div>

                <div className="progress-bar mb-2" style={{ height: 10 }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
                <div className="flex justify-between text-xs mb-3">
                  <span style={{ fontWeight: 600, color }}>{pct.toFixed(1)}%</span>
                  <span className="text-muted">Falta {formatCurrency(falta)}</span>
                </div>

                <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 12 }}>
                  <div className="stat-row" style={{ paddingTop: 0 }}>
                    <span className="text-muted">Prazo</span>
                    <span>{meta.prazo?.split('-').reverse().join('/') || '—'} ({mesesRestantes} meses)</span>
                  </div>
                  <div className="stat-row">
                    <span className="text-muted">Economizar/mês</span>
                    <span style={{ fontWeight: 700, color: viavel ? 'var(--accent-green)' : 'var(--accent-red)' }}>{formatCurrency(porMes)}</span>
                  </div>
                  {!viavel && !concluida && <div style={{ marginTop: 6, color: 'var(--accent-yellow)', fontSize: 11 }}>⚠️ Acima do saldo disponível. Ajuste receitas ou prazo.</div>}
                  {viavel && !concluida && <div style={{ marginTop: 6, color: 'var(--accent-green)', fontSize: 11 }}>✓ Meta viável com o saldo atual!</div>}
                </div>

                <div className="flex gap-2 mt-3">
                  <input
                    type="number" className="input"
                    placeholder="Atualizar valor acumulado"
                    key={meta.id + '_' + meta.acumulado}
                    defaultValue={meta.acumulado}
                    onBlur={e => handleUpdateAcumulado(meta.id, e.target.value)}
                    style={{ fontSize: 13 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Calculadoras */}
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Calculadoras</h2>
      <div className="grid-3">
        <CalculadoraJuros />
        <SimuladorInvestimento />
        <SimuladorAposentadoria />
      </div>
    </div>
  );
}
