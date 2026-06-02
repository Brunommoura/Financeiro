import { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Edit2, Calculator } from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/helpers';
import { databases, COLLECTIONS, DATABASE_ID, ID, Permission, Role, Query } from '../lib/appwrite';

const TIPOS = ['Empréstimo', 'Financiamento', 'Cartão', 'Cheque Especial', 'Outros'];

export default function Dividas({ dividasList, setDividasList, user }) {
  const [showForm, setShowForm] = useState(false);
  const [calcModal, setCalcModal] = useState(null);
  const [antecipacao, setAntecipacao] = useState('');
  const [form, setForm] = useState({ tipo: 'Financiamento', credor: '', descricao: '', valorOriginal: '', saldoDevedor: '', taxaJuros: '', parcelaMensal: '', dataQuitacao: '' });
  const [editingId, setEditingId] = useState(null);
  const [carregandoDividas, setCarregandoDividas] = useState(true);

  useEffect(() => {
    const buscarDividas = async () => {
      try {
        setCarregandoDividas(true);
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.DIVIDAS,
          [Query.equal('userId', user.$id)]
        );
        const mapped = response.documents.map(d => ({
          ...d,
          id: d.$id,
          tipo: d.tipo,
          credor: d.credor,
          descricao: d.descricao || d.credor,
          valorOriginal: d.valorOriginal,
          saldoDevedor: d.saldoDevedor,
          taxaJuros: d.taxaJuros,
          parcelaMensal: d.parcelaMensal,
          dataQuitacao: d.dataQuitacao ? d.dataQuitacao.split('T')[0] : ''
        }));
        setDividasList(mapped);
      } catch (error) {
        console.error('Erro ao buscar dívidas:', error);
      } finally {
        setCarregandoDividas(false);
      }
    };
    if (user) buscarDividas();
  }, [user, setDividasList]);

  const totalDividas = useMemo(() => dividasList.reduce((s, d) => s + d.saldoDevedor, 0), [dividasList]);

  const handleOpenForm = (divida = null) => {
    if (divida) {
      setEditingId(divida.id);
      setForm({ ...divida, valorOriginal: divida.valorOriginal.toString(), saldoDevedor: divida.saldoDevedor.toString(), taxaJuros: divida.taxaJuros.toString(), parcelaMensal: divida.parcelaMensal.toString() });
    } else {
      setEditingId(null);
      setForm({ tipo: 'Financiamento', credor: '', descricao: '', valorOriginal: '', saldoDevedor: '', taxaJuros: '', parcelaMensal: '', dataQuitacao: '' });
    }
    setShowForm(true);
  };

  const handleAdd = async () => {
    if (!form.credor || !form.saldoDevedor) return;
    try {
      if (editingId) {
        const doc = await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.DIVIDAS,
          editingId,
          {
            tipo: form.tipo,
            credor: form.credor,
            descricao: form.descricao || null,
            valorOriginal: parseFloat(form.valorOriginal) || 0,
            saldoDevedor: parseFloat(form.saldoDevedor),
            taxaJuros: parseFloat(form.taxaJuros) || 0,
            parcelaMensal: parseFloat(form.parcelaMensal) || 0,
            dataQuitacao: form.dataQuitacao ? new Date(form.dataQuitacao).toISOString() : null
          }
        );
        const updated = {
          ...doc, id: doc.$id, tipo: doc.tipo, credor: doc.credor, descricao: doc.descricao || doc.credor,
          valorOriginal: doc.valorOriginal, saldoDevedor: doc.saldoDevedor, taxaJuros: doc.taxaJuros, 
          parcelaMensal: doc.parcelaMensal, dataQuitacao: doc.dataQuitacao ? doc.dataQuitacao.split('T')[0] : ''
        };
        setDividasList(prev => prev.map(d => d.id === editingId ? updated : d));
      } else {
        const doc = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.DIVIDAS,
          ID.unique(),
          {
            userId: user.$id,
            tipo: form.tipo,
            credor: form.credor,
            descricao: form.descricao || null,
            valorOriginal: parseFloat(form.valorOriginal) || 0,
            saldoDevedor: parseFloat(form.saldoDevedor),
            taxaJuros: parseFloat(form.taxaJuros) || 0,
            parcelaMensal: parseFloat(form.parcelaMensal) || 0,
            dataQuitacao: form.dataQuitacao ? new Date(form.dataQuitacao).toISOString() : null
          },
          [
            Permission.read(Role.user(user.$id)),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id))
          ]
        );
        const novo = {
          ...doc, id: doc.$id, tipo: doc.tipo, credor: doc.credor, descricao: doc.descricao || doc.credor,
          valorOriginal: doc.valorOriginal, saldoDevedor: doc.saldoDevedor, taxaJuros: doc.taxaJuros, 
          parcelaMensal: doc.parcelaMensal, dataQuitacao: doc.dataQuitacao ? doc.dataQuitacao.split('T')[0] : ''
        };
        setDividasList(prev => [...prev, novo]);
      }
      setShowForm(false);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar dívida.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja excluir esta dívida?")) {
      try {
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.DIVIDAS, id);
        setDividasList(prev => prev.filter(d => d.id !== id));
      } catch (e) {
        console.error(e);
        alert('Erro ao excluir dívida.');
      }
    }
  };

  // Calculadora de antecipação
  const calcAntecipacao = (divida, valor) => {
    if (!valor || !divida) return null;
    const mensal = divida.taxaJuros / 100;
    const mesesRestantes = divida.parcelaMensal > 0
      ? Math.ceil(divida.saldoDevedor / divida.parcelaMensal)
      : 0;
    const economiaSemAntec = divida.saldoDevedor * (Math.pow(1 + mensal, mesesRestantes) - 1);
    const novoSaldo = divida.saldoDevedor - parseFloat(valor);
    if (novoSaldo <= 0) return { mesesEconomizados: mesesRestantes, economiaTotal: economiaSemAntec };
    const novosMeses = novoSaldo > 0 && divida.parcelaMensal > 0 ? Math.ceil(novoSaldo / divida.parcelaMensal) : 0;
    const economiaNova = novoSaldo * (Math.pow(1 + mensal, novosMeses) - 1);
    return {
      mesesEconomizados: mesesRestantes - novosMeses,
      economiaTotal: economiaSemAntec - economiaNova,
      novoSaldo
    };
  };

  const result = calcModal ? calcAntecipacao(calcModal, antecipacao) : null;

  const tipoBadge = { 'Financiamento': 'badge-blue', 'Empréstimo': 'badge-red', 'Cartão': 'badge-purple', 'Cheque Especial': 'badge-yellow', 'Outros': 'badge-gray' };

  if (carregandoDividas) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" style={{ borderBottomColor: 'transparent' }} />
        <span className="text-muted">Carregando dívidas...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      {/* Modal calculadora */}
      {calcModal && (
        <div className="modal-overlay" onClick={() => setCalcModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">💰 Simulador de Antecipação</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setCalcModal(null)}>✕</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Dívida: <strong>{calcModal.descricao || calcModal.credor}</strong>
              </div>
              <div className="stat-row">
                <span className="text-muted">Saldo devedor</span>
                <strong style={{ color: 'var(--accent-red)' }}>{formatCurrency(calcModal.saldoDevedor)}</strong>
              </div>
              <div className="stat-row">
                <span className="text-muted">Taxa de juros (a.a.)</span>
                <strong>{formatPercent(calcModal.taxaJuros)}</strong>
              </div>
              <div className="stat-row">
                <span className="text-muted">Parcela mensal</span>
                <strong>{formatCurrency(calcModal.parcelaMensal)}</strong>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Valor para antecipar (R$)</label>
              <input type="number" className="input" placeholder="0,00" value={antecipacao} onChange={e => setAntecipacao(e.target.value)} />
            </div>
            {result && antecipacao > 0 && (
              <div style={{ marginTop: 16, padding: 16, background: 'rgba(16,185,129,0.1)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)' }}>
                <div className="stat-row">
                  <span>Novo saldo</span>
                  <strong style={{ color: 'var(--accent-blue)' }}>{formatCurrency(result.novoSaldo || 0)}</strong>
                </div>
                <div className="stat-row">
                  <span>Meses economizados</span>
                  <strong style={{ color: 'var(--accent-green)' }}>{result.mesesEconomizados} meses</strong>
                </div>
                <div className="stat-row">
                  <span>Economia em juros</span>
                  <strong style={{ color: 'var(--accent-green)' }}>{formatCurrency(result.economiaTotal)}</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="section-header mb-4">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Dívidas</h1>
          <p className="text-secondary">Total em dívidas: <strong style={{ color: 'var(--accent-red)' }}>{formatCurrency(totalDividas)}</strong></p>
        </div>
        <button className="btn btn-danger" onClick={() => handleOpenForm()}>
          <Plus size={16} /> Nova Dívida
        </button>
      </div>

      {showForm && (
        <div className="card mb-4 animate-fade" style={{ borderColor: 'var(--accent-red)' }}>
          <div className="section-title mb-3">{editingId ? 'Editar Dívida' : 'Nova Dívida'}</div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Tipo</label>
              <select className="input" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Credor</label>
              <input className="input" placeholder="Ex: Banco do Brasil" value={form.credor} onChange={e => setForm({ ...form, credor: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Descrição</label>
              <input className="input" placeholder="Ex: Financiamento imóvel" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Valor Original (R$)</label>
              <input type="number" className="input" value={form.valorOriginal} onChange={e => setForm({ ...form, valorOriginal: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Saldo Devedor (R$)</label>
              <input type="number" className="input" value={form.saldoDevedor} onChange={e => setForm({ ...form, saldoDevedor: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Taxa Juros (% a.a.)</label>
              <input type="number" className="input" value={form.taxaJuros} onChange={e => setForm({ ...form, taxaJuros: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Parcela Mensal (R$)</label>
              <input type="number" className="input" value={form.parcelaMensal} onChange={e => setForm({ ...form, parcelaMensal: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Previsão de Quitação</label>
              <input type="date" className="input" value={form.dataQuitacao} onChange={e => setForm({ ...form, dataQuitacao: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="btn btn-danger" onClick={handleAdd}>Salvar</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {dividasList.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          <p>Nenhuma dívida cadastrada. Excelente!</p>
          <button className="btn btn-primary mt-2" onClick={() => handleOpenForm()}>+ Adicionar Dívida</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {dividasList.map(d => {
            const pctPago = d.valorOriginal > 0 ? ((d.valorOriginal - d.saldoDevedor) / d.valorOriginal) * 100 : 0;
            const mesesRest = d.parcelaMensal > 0 ? Math.ceil(d.saldoDevedor / d.parcelaMensal) : '—';
            return (
              <div key={d.id} className="card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{d.descricao || d.credor}</div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className={`badge ${tipoBadge[d.tipo] || 'badge-gray'}`}>{d.tipo}</span>
                      <span className="badge badge-gray">{d.credor}</span>
                      {d.taxaJuros > 0 && <span className="badge badge-red">{formatPercent(d.taxaJuros)} a.a.</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => { setCalcModal(d); setAntecipacao(''); }}>
                      <Calculator size={14} /> Simular
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleOpenForm(d)}>
                      <Edit2 size={14} color="var(--accent-blue)" />
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(d.id)}>
                      <Trash2 size={14} color="var(--accent-red)" />
                    </button>
                  </div>
                </div>

                <div className="grid-4 mb-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  <div style={{ padding: 10, background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{formatCurrency(d.valorOriginal)}</div>
                    <div className="text-xs text-muted">Valor Original</div>
                  </div>
                  <div style={{ padding: 10, background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-red)', fontSize: 13 }}>{formatCurrency(d.saldoDevedor)}</div>
                    <div className="text-xs text-muted">Saldo Devedor</div>
                  </div>
                  <div style={{ padding: 10, background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-blue)', fontSize: 13 }}>{formatCurrency(d.parcelaMensal)}</div>
                    <div className="text-xs text-muted">Parcela Mensal</div>
                  </div>
                  <div style={{ padding: 10, background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{mesesRest} {mesesRest !== '—' ? 'meses' : ''}</div>
                    <div className="text-xs text-muted">Restantes</div>
                  </div>
                </div>

                {d.valorOriginal > 0 && (
                  <>
                    <div className="progress-bar mb-1">
                      <div className="progress-fill" style={{ width: `${pctPago}%`, background: 'var(--accent-green)' }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted">
                      <span>{pctPago.toFixed(1)}% pago</span>
                      {d.dataQuitacao && <span>Quitação prevista: {d.dataQuitacao.split('-').reverse().join('/')}</span>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
