import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, CreditCard, AlertCircle } from 'lucide-react';
import { formatCurrency, getMonthKey } from '../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const BANDEIRAS = ['Mastercard', 'Visa', 'Elo', 'Amex', 'Hipercard'];

export default function Cartoes({ cartoes, setCartoes, despesas }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
    name: '', brand: 'Mastercard', lastDigits: '',
    limit: '', closingDay: '', dueDay: '', color: '#8B5CF6', active: true
  });

  const handleOpenForm = (cartao = null) => {
    if (cartao) {
      setEditingId(cartao.id);
      setForm({ ...cartao, limit: cartao.limit.toString(), closingDay: cartao.closingDay.toString(), dueDay: cartao.dueDay.toString() });
    } else {
      setEditingId(null);
      setForm({ name: '', brand: 'Mastercard', lastDigits: '', limit: '', closingDay: '', dueDay: '', color: '#8B5CF6', active: true });
    }
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name || !form.limit || !form.closingDay || !form.dueDay) return;
    
    const limit = parseFloat(form.limit);
    const closingDay = parseInt(form.closingDay);
    const dueDay = parseInt(form.dueDay);

    if (editingId) {
      setCartoes(prev => prev.map(c => c.id === editingId ? { ...form, id: c.id, limit, closingDay, dueDay } : c));
    } else {
      setCartoes(prev => [...prev, { ...form, id: Date.now(), limit, closingDay, dueDay }]);
    }
    setShowForm(false);
  };

  const handleDelete = (id) => {
    const hasDespesas = despesas.some(d => d.cartaoId === id);
    if (hasDespesas) {
      alert("Não é possível excluir um cartão que possui despesas vinculadas. Tente inativá-lo.");
      return;
    }
    if (window.confirm("Deseja realmente excluir este cartão?")) {
      setCartoes(prev => prev.filter(c => c.id !== id));
    }
  };

  const toggleActive = (id) => {
    setCartoes(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  // Cálculo de uso de cartões no mês atual
  const currentMonth = getMonthKey(new Date().toISOString().split('T')[0]);
  
  const cartoesComUso = useMemo(() => {
    return cartoes.map(c => {
      // Filtrar despesas não pagas, ou que foram pro cartão este mês?
      // O correto em cartão é somar as despesas que cairão na próxima fatura,
      // mas para simplificar o dashboard do mês, pegamos as despesas do cartão no mês selecionado.
      const despesasMes = despesas.filter(d => d.cartaoId === c.id && getMonthKey(d.data) === currentMonth);
      const usadoMes = despesasMes.reduce((s, d) => s + d.valor, 0);
      return { ...c, usadoMes, disponivel: Math.max(0, c.limit - usadoMes) };
    });
  }, [cartoes, despesas, currentMonth]);

  const totalLimite = cartoes.reduce((s, c) => s + c.limit, 0);
  const totalUsado = cartoesComUso.reduce((s, c) => s + c.usadoMes, 0);
  const totalDisponivel = Math.max(0, totalLimite - totalUsado);

  const chartData = cartoesComUso.map(c => ({
    name: c.name,
    usado: c.usadoMes,
    color: c.color
  })).filter(c => c.usado > 0);

  return (
    <div className="animate-fade">
      <div className="section-header mb-4">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Cartões de Crédito</h1>
          <p className="text-secondary">Gerencie seus limites e faturas</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenForm()}>
          <Plus size={16} /> Novo Cartão
        </button>
      </div>

      <div className="grid-4 mb-6">
        <div className="card">
          <div className="text-muted text-xs mb-1">Limite Total</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{formatCurrency(totalLimite)}</div>
        </div>
        <div className="card">
          <div className="text-muted text-xs mb-1">Usado neste mês</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-red)' }}>{formatCurrency(totalUsado)}</div>
        </div>
        <div className="card">
          <div className="text-muted text-xs mb-1">Total Disponível</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-green)' }}>{formatCurrency(totalDisponivel)}</div>
        </div>
        <div className="card">
          <div className="text-muted text-xs mb-1">Cartão Mais Usado</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-purple)' }}>
            {cartoesComUso.length > 0 ? [...cartoesComUso].sort((a,b) => b.usadoMes - a.usadoMes)[0]?.name || '-' : '-'}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card mb-6 animate-fade" style={{ borderColor: 'var(--accent-purple)' }}>
          <div className="section-title mb-3">{editingId ? 'Editar Cartão' : 'Novo Cartão'}</div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Nome (ex: Nubank)</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Bandeira</label>
              <select className="input" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })}>
                {BANDEIRAS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Últimos 4 Dígitos (Opc.)</label>
              <input className="input" maxLength={4} placeholder="1234" value={form.lastDigits} onChange={e => setForm({ ...form, lastDigits: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Limite Total (R$)</label>
              <input type="number" className="input" value={form.limit} onChange={e => setForm({ ...form, limit: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Dia de Fechamento</label>
              <input type="number" className="input" min="1" max="31" value={form.closingDay} onChange={e => setForm({ ...form, closingDay: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Dia de Vencimento</label>
              <input type="number" className="input" min="1" max="31" value={form.dueDay} onChange={e => setForm({ ...form, dueDay: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Cor de Identificação</label>
              <input type="color" className="input" style={{ padding: 4, height: 42, cursor: 'pointer' }} value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn btn-primary" onClick={handleSave}>Salvar Cartão</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {cartoesComUso.map(c => {
            const pctUsado = c.limit > 0 ? (c.usadoMes / c.limit) * 100 : 0;
            const isNearLimit = pctUsado > 80;

            return (
              <div key={c.id} className="card" style={{ borderLeft: `4px solid ${c.color}`, opacity: c.active ? 1 : 0.6 }}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className="icon-box" style={{ background: `${c.color}20` }}>
                      <CreditCard size={20} color={c.color} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{c.name} {c.lastDigits && <span className="text-muted text-sm">({c.lastDigits})</span>}</div>
                      <div className="text-muted text-xs">{c.brand} · Vence dia {c.dueDay}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(c.id)}>
                      {c.active ? 'Inativar' : 'Ativar'}
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleOpenForm(c)}>
                      <Edit2 size={14} color="var(--accent-blue)" />
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(c.id)}>
                      <Trash2 size={14} color="var(--accent-red)" />
                    </button>
                  </div>
                </div>

                <div className="grid-3 mb-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  <div>
                    <div className="text-xs text-muted">Limite</div>
                    <div style={{ fontWeight: 600 }}>{formatCurrency(c.limit)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Usado Mês</div>
                    <div style={{ fontWeight: 600, color: 'var(--accent-red)' }}>{formatCurrency(c.usadoMes)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Disponível</div>
                    <div style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{formatCurrency(c.disponivel)}</div>
                  </div>
                </div>

                <div className="progress-bar mb-2" style={{ background: 'var(--border-light)' }}>
                  <div className="progress-fill" style={{ width: `${Math.min(100, pctUsado)}%`, background: isNearLimit ? 'var(--accent-red)' : c.color }} />
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted">{pctUsado.toFixed(1)}% do limite usado</div>
                  {isNearLimit && <div className="text-xs text-red flex items-center gap-1"><AlertCircle size={12}/> Próximo ao limite</div>}
                </div>
              </div>
            );
          })}
          
          {cartoes.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              Nenhum cartão cadastrado.
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-title mb-4">Uso por Cartão (Mês Atual)</div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
                <Bar dataKey="usado" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
              Nenhum gasto em cartão registrado este mês.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
