import { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/helpers';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TIPOS = ['Conta Corrente', 'Poupança', 'Investimentos', 'Imóvel', 'Veículo', 'Previdência', 'Outros'];
const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f97316', '#f59e0b', '#06b6d4', '#64748b'];

export default function Patrimonio({ patrimonio, setPatrimonio }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tipo: 'Conta Corrente', instituicao: '', descricao: '', valorAtual: '', variacaoMensal: '' });

  const totalPatrimonio = useMemo(() => patrimonio.reduce((s, p) => s + p.valorAtual, 0), [patrimonio]);

  const pieData = useMemo(() => {
    const map = {};
    patrimonio.forEach(p => { map[p.tipo] = (map[p.tipo] || 0) + p.valorAtual; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [patrimonio]);

  const handleAdd = () => {
    if (!form.instituicao || !form.valorAtual) return;
    setPatrimonio(prev => [...prev, {
      ...form, id: Date.now(),
      valorAtual: parseFloat(form.valorAtual),
      variacaoMensal: parseFloat(form.variacaoMensal) || 0
    }]);
    setForm({ tipo: 'Conta Corrente', instituicao: '', descricao: '', valorAtual: '', variacaoMensal: '' });
    setShowForm(false);
  };

  const handleDelete = (id) => setPatrimonio(prev => prev.filter(p => p.id !== id));

  const tipoColor = {};
  TIPOS.forEach((t, i) => { tipoColor[t] = COLORS[i % COLORS.length]; });

  return (
    <div className="animate-fade">
      <div className="section-header mb-4">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Patrimônio</h1>
          <p className="text-secondary">Total: <strong style={{ color: 'var(--accent-green)' }}>{formatCurrency(totalPatrimonio)}</strong></p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Novo Ativo
        </button>
      </div>

      {showForm && (
        <div className="card mb-4 animate-fade" style={{ borderColor: 'var(--accent-blue)' }}>
          <div className="section-title mb-3">Novo Ativo</div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Tipo</label>
              <select className="input" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Instituição/Local</label>
              <input className="input" placeholder="Ex: Nubank" value={form.instituicao} onChange={e => setForm({ ...form, instituicao: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Descrição</label>
              <input className="input" placeholder="Ex: Conta principal" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Valor Atual (R$)</label>
              <input type="number" className="input" placeholder="0,00" value={form.valorAtual} onChange={e => setForm({ ...form, valorAtual: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Variação Mensal (R$)</label>
              <input type="number" className="input" placeholder="0,00" value={form.variacaoMensal} onChange={e => setForm({ ...form, variacaoMensal: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="btn btn-primary" onClick={handleAdd}>Salvar</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Gráfico de alocação */}
      <div className="grid-2 mb-6">
        <div className="card">
          <div className="section-title mb-3">Distribuição Patrimonial</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} innerRadius={45} dataKey="value" nameKey="name">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Patrimônio Total</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-green)' }}>{formatCurrency(totalPatrimonio)}</div>
          </div>
        </div>

        <div className="card">
          <div className="section-title mb-3">Resumo por Tipo</div>
          {pieData.map((item, i) => {
            const pct = totalPatrimonio > 0 ? (item.value / totalPatrimonio) * 100 : 0;
            const variation = patrimonio.filter(p => p.tipo === item.name).reduce((s, p) => s + p.variacaoMensal, 0);
            return (
              <div key={item.name} style={{ marginBottom: 14 }}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700 }}>{formatCurrency(item.value)}</span>
                    <span className="text-muted" style={{ fontSize: 11, marginLeft: 6 }}>{formatPercent(pct)}</span>
                    {variation !== 0 && (
                      <span style={{ fontSize: 11, color: variation > 0 ? 'var(--accent-green)' : 'var(--accent-red)', marginLeft: 6 }}>
                        {variation > 0 ? '+' : ''}{formatCurrency(variation)}/mês
                      </span>
                    )}
                  </div>
                </div>
                <div className="progress-bar" style={{ height: 5 }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabela de ativos */}
      <div className="card">
        <div className="section-title mb-3">Detalhamento de Ativos</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Instituição</th>
                <th>Descrição</th>
                <th style={{ textAlign: 'right' }}>Valor Atual</th>
                <th style={{ textAlign: 'right' }}>Var. Mensal</th>
                <th style={{ textAlign: 'right' }}>% Patrimônio</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {patrimonio.map(p => {
                const pct = totalPatrimonio > 0 ? (p.valorAtual / totalPatrimonio) * 100 : 0;
                const color = tipoColor[p.tipo] || COLORS[0];
                return (
                  <tr key={p.id}>
                    <td><span className="badge" style={{ background: `${color}22`, color }}>{p.tipo}</span></td>
                    <td style={{ fontWeight: 500 }}>{p.instituicao}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{p.descricao}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-green)', whiteSpace: 'nowrap' }}>{formatCurrency(p.valorAtual)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: p.variacaoMensal >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', whiteSpace: 'nowrap' }}>
                      {p.variacaoMensal >= 0 ? '+' : ''}{formatCurrency(p.variacaoMensal)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex items-center gap-2" style={{ justifyContent: 'flex-end' }}>
                        <div className="progress-bar" style={{ width: 60, height: 5 }}>
                          <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, minWidth: 36 }}>{formatPercent(pct)}</span>
                      </div>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(p.id)}>
                        <Trash2 size={14} color="var(--accent-red)" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
