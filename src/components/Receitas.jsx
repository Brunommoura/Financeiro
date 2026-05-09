import { useState, useMemo } from 'react';
import { Plus, Trash2, Filter, Search } from 'lucide-react';
import { formatCurrency, formatDate, getMonthKey } from '../utils/helpers';

const CATEGORIAS = ['Salário', 'Freelance', 'Investimentos', 'Aluguel', 'Outros'];

export default function Receitas({ receitas, setReceitas }) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filtCat, setFiltCat] = useState('');
  const [filtMes, setFiltMes] = useState('');
  const [form, setForm] = useState({ data: new Date().toISOString().split('T')[0], descricao: '', categoria: 'Salário', valor: '', recorrente: false, observacoes: '' });

  const meses = useMemo(() => {
    const s = new Set(receitas.map(r => getMonthKey(r.data)));
    return Array.from(s).sort().reverse();
  }, [receitas]);

  const filtered = useMemo(() => receitas.filter(r => {
    if (filtCat && r.categoria !== filtCat) return false;
    if (filtMes && getMonthKey(r.data) !== filtMes) return false;
    if (search && !r.descricao.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [receitas, filtCat, filtMes, search]);

  const total = filtered.reduce((s, r) => s + r.valor, 0);

  const handleAdd = () => {
    if (!form.descricao || !form.valor || !form.data) return;
    setReceitas(prev => [...prev, { ...form, id: Date.now(), valor: parseFloat(form.valor) }]);
    setForm({ data: new Date().toISOString().split('T')[0], descricao: '', categoria: 'Salário', valor: '', recorrente: false, observacoes: '' });
    setShowForm(false);
  };

  const handleDelete = (id) => setReceitas(prev => prev.filter(r => r.id !== id));

  return (
    <div className="animate-fade">
      <div className="section-header mb-4">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Receitas</h1>
          <p className="text-secondary">Total filtrado: <strong style={{ color: 'var(--accent-green)' }}>{formatCurrency(total)}</strong></p>
        </div>
        <button className="btn btn-success" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Nova Receita
        </button>
      </div>

      {showForm && (
        <div className="card mb-4 animate-fade" style={{ borderColor: 'var(--accent-green)' }}>
          <div className="section-title mb-3">Nova Receita</div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Data</label>
              <input type="date" className="input" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Descrição</label>
              <input className="input" placeholder="Ex: Salário Maio" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Categoria</label>
              <select className="input" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Valor (R$)</label>
              <input type="number" className="input" placeholder="0,00" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Observações</label>
              <input className="input" placeholder="Opcional" value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 22 }}>
              <input type="checkbox" id="rec" checked={form.recorrente} onChange={e => setForm({ ...form, recorrente: e.target.checked })} style={{ width: 16, height: 16 }} />
              <label htmlFor="rec" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>Recorrente</label>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="btn btn-success" onClick={handleAdd}>Salvar</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="card mb-4">
        <div className="form-row" style={{ gridTemplateColumns: 'auto 1fr 1fr' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" placeholder="Buscar..." style={{ paddingLeft: 30 }} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" value={filtCat} onChange={e => setFiltCat(e.target.value)}>
            <option value="">Todas categorias</option>
            {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="input" value={filtMes} onChange={e => setFiltMes(e.target.value)}>
            <option value="">Todos os meses</option>
            {meses.map(m => {
              const [y, mo] = m.split('-');
              const names = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
              return <option key={m} value={m}>{names[parseInt(mo)-1]}/{y}</option>;
            })}
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Recorrente</th>
                <th>Observações</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Nenhum registro encontrado</td></tr>
              )}
              {filtered.map(r => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(r.data)}</td>
                  <td style={{ fontWeight: 500 }}>{r.descricao}</td>
                  <td><span className="badge badge-green">{r.categoria}</span></td>
                  <td><span className={`badge ${r.recorrente ? 'badge-blue' : 'badge-gray'}`}>{r.recorrente ? 'Sim' : 'Não'}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.observacoes || '-'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-green)', whiteSpace: 'nowrap' }}>{formatCurrency(r.valor)}</td>
                  <td>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(r.id)} title="Excluir">
                      <Trash2 size={14} color="var(--accent-red)" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} style={{ fontWeight: 700, paddingTop: 12, borderTop: '2px solid var(--border)' }}>Total</td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--accent-green)', fontSize: 15, borderTop: '2px solid var(--border)' }}>{formatCurrency(total)}</td>
                <td style={{ borderTop: '2px solid var(--border)' }}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
