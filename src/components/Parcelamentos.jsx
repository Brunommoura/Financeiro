import { useState, useMemo } from 'react';
import { Plus, Trash2, CreditCard } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function Parcelamentos({ parcelamentos, setParcelamentos }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nome: '', valorTotal: '', parcelas: '', dataPrimeiraParcela: new Date().toISOString().split('T')[0],
    parcelasPagas: 0, formaPagamento: 'Crédito'
  });

  const handleAdd = () => {
    if (!form.nome || !form.valorTotal || !form.parcelas) return;
    const valorTotal = parseFloat(form.valorTotal);
    const parcelas = parseInt(form.parcelas);
    setParcelamentos(prev => [...prev, {
      ...form, id: Date.now(), valorTotal, parcelas,
      valorParcela: valorTotal / parcelas, parcelasPagas: parseInt(form.parcelasPagas) || 0
    }]);
    setForm({ nome: '', valorTotal: '', parcelas: '', dataPrimeiraParcela: new Date().toISOString().split('T')[0], parcelasPagas: 0, formaPagamento: 'Crédito' });
    setShowForm(false);
  };

  const handleDelete = (id) => setParcelamentos(prev => prev.filter(p => p.id !== id));
  const handlePay = (id) => setParcelamentos(prev => prev.map(p => p.id === id && p.parcelasPagas < p.parcelas ? { ...p, parcelasPagas: p.parcelasPagas + 1 } : p));

  const totalFuturo = useMemo(() =>
    parcelamentos.reduce((s, p) => s + (p.parcelas - p.parcelasPagas) * p.valorParcela, 0),
    [parcelamentos]
  );

  const getProxDatas = (p) => {
    const datas = [];
    const first = new Date(p.dataPrimeiraParcela);
    for (let i = p.parcelasPagas; i < Math.min(p.parcelas, p.parcelasPagas + 3); i++) {
      const d = new Date(first);
      d.setMonth(first.getMonth() + i);
      datas.push({ num: i + 1, data: d.toISOString().split('T')[0] });
    }
    return datas;
  };

  return (
    <div className="animate-fade">
      <div className="section-header mb-4">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Parcelamentos</h1>
          <p className="text-secondary">Total em aberto: <strong style={{ color: 'var(--accent-purple)' }}>{formatCurrency(totalFuturo)}</strong></p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Novo Parcelamento
        </button>
      </div>

      {showForm && (
        <div className="card mb-4 animate-fade" style={{ borderColor: 'var(--accent-purple)' }}>
          <div className="section-title mb-3">Novo Parcelamento</div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Nome do Item</label>
              <input className="input" placeholder="Ex: iPhone 15" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Valor Total (R$)</label>
              <input type="number" className="input" placeholder="0,00" value={form.valorTotal} onChange={e => setForm({ ...form, valorTotal: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Nº de Parcelas</label>
              <input type="number" className="input" placeholder="12" value={form.parcelas} onChange={e => setForm({ ...form, parcelas: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Parcelas Pagas</label>
              <input type="number" className="input" placeholder="0" value={form.parcelasPagas} onChange={e => setForm({ ...form, parcelasPagas: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Primeira Parcela</label>
              <input type="date" className="input" value={form.dataPrimeiraParcela} onChange={e => setForm({ ...form, dataPrimeiraParcela: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Forma de Pagamento</label>
              <select className="input" value={form.formaPagamento} onChange={e => setForm({ ...form, formaPagamento: e.target.value })}>
                {['Crédito', 'Débito', 'Boleto'].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="btn btn-primary" onClick={handleAdd}>Salvar</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Cards de parcelamento */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {parcelamentos.map(p => {
          const restantes = p.parcelas - p.parcelasPagas;
          const totalPago = p.parcelasPagas * p.valorParcela;
          const totalRestante = restantes * p.valorParcela;
          const pct = (p.parcelasPagas / p.parcelas) * 100;
          const proxDatas = getProxDatas(p);

          return (
            <div key={p.id} className="card">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div className="icon-box" style={{ background: 'rgba(139,92,246,0.1)' }}>
                    <CreditCard size={20} color="var(--accent-purple)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{p.nome}</div>
                    <div className="text-muted text-xs">{p.formaPagamento} · {formatCurrency(p.valorParcela)}/mês</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {restantes > 0 && (
                    <button className="btn btn-ghost btn-sm" onClick={() => handlePay(p.id)}>✓ Pagar parcela</button>
                  )}
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(p.id)}>
                    <Trash2 size={14} color="var(--accent-red)" />
                  </button>
                </div>
              </div>

              <div className="grid-4 mb-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div style={{ textAlign: 'center', padding: 10, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div style={{ fontWeight: 700 }}>{formatCurrency(p.valorTotal)}</div>
                  <div className="text-xs text-muted">Valor Total</div>
                </div>
                <div style={{ textAlign: 'center', padding: 10, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{p.parcelasPagas}/{p.parcelas}</div>
                  <div className="text-xs text-muted">Pagas/Total</div>
                </div>
                <div style={{ textAlign: 'center', padding: 10, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-red)' }}>{formatCurrency(totalRestante)}</div>
                  <div className="text-xs text-muted">Em Aberto</div>
                </div>
                <div style={{ textAlign: 'center', padding: 10, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>{restantes}</div>
                  <div className="text-xs text-muted">Parcelas Rest.</div>
                </div>
              </div>

              <div className="progress-bar mb-2">
                <div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--accent-purple)' }} />
              </div>
              <div className="flex justify-between text-xs text-muted mb-3">
                <span>{pct.toFixed(0)}% pago</span>
                <span>{formatCurrency(totalPago)} pago de {formatCurrency(p.valorTotal)}</span>
              </div>

              {proxDatas.length > 0 && (
                <div>
                  <div className="text-xs text-muted mb-2" style={{ fontWeight: 600 }}>Próximas parcelas:</div>
                  <div className="flex gap-2 flex-wrap">
                    {proxDatas.map(pd => (
                      <div key={pd.num} style={{
                        padding: '6px 12px', background: 'rgba(139,92,246,0.1)',
                        borderRadius: 6, fontSize: 12, border: '1px solid rgba(139,92,246,0.2)'
                      }}>
                        <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>Parcela {pd.num}</span>
                        <span className="text-muted"> · {pd.data.split('-').reverse().join('/')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {restantes === 0 && (
                <div className="badge badge-green" style={{ width: 'fit-content', marginTop: 8 }}>✓ Parcelamento quitado!</div>
              )}
            </div>
          );
        })}

        {parcelamentos.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            Nenhum parcelamento cadastrado
          </div>
        )}
      </div>
    </div>
  );
}
