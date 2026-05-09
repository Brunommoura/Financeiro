import { useState, useMemo } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { formatCurrency, formatDate, getMonthKey } from '../utils/helpers';

const CATEGORIAS = ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Outros'];
const TIPOS = ['Fixa', 'Variável', 'Parcelada'];
const PAGAMENTOS = ['Débito', 'Crédito', 'PIX', 'Dinheiro', 'Boleto'];
const STATUS = ['Pago', 'Pendente'];

export default function Despesas({ despesas, setDespesas }) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filtCat, setFiltCat] = useState('');
  const [filtTipo, setFiltTipo] = useState('');
  const [filtStatus, setFiltStatus] = useState('');
  const [filtMes, setFiltMes] = useState('');
  const [form, setForm] = useState({
    data: new Date().toISOString().split('T')[0],
    descricao: '', categoria: 'Moradia', tipo: 'Fixa', valor: '',
    pagamento: 'Débito', status: 'Pendente', observacoes: ''
  });

  const meses = useMemo(() => {
    const s = new Set(despesas.map(d => getMonthKey(d.data)));
    return Array.from(s).sort().reverse();
  }, [despesas]);

  const filtered = useMemo(() => despesas.filter(d => {
    if (filtCat && d.categoria !== filtCat) return false;
    if (filtTipo && d.tipo !== filtTipo) return false;
    if (filtStatus && d.status !== filtStatus) return false;
    if (filtMes && getMonthKey(d.data) !== filtMes) return false;
    if (search && !d.descricao.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [despesas, filtCat, filtTipo, filtStatus, filtMes, search]);

  const total = filtered.reduce((s, d) => s + d.valor, 0);

  const handleAdd = () => {
    if (!form.descricao || !form.valor || !form.data) return;
    setDespesas(prev => [...prev, { ...form, id: Date.now(), valor: parseFloat(form.valor) }]);
    setForm({ data: new Date().toISOString().split('T')[0], descricao: '', categoria: 'Moradia', tipo: 'Fixa', valor: '', pagamento: 'Débito', status: 'Pendente', observacoes: '' });
    setShowForm(false);
  };

  const handleDelete = (id) => setDespesas(prev => prev.filter(d => d.id !== id));
  const toggleStatus = (id) => setDespesas(prev => prev.map(d => d.id === id ? { ...d, status: d.status === 'Pago' ? 'Pendente' : 'Pago' } : d));

  const tipoBadge = { 'Fixa': 'badge-blue', 'Variável': 'badge-yellow', 'Parcelada': 'badge-purple' };

  return (
    <div className="animate-fade">
      <div className="section-header mb-4">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Despesas</h1>
          <p className="text-secondary">Total filtrado: <strong style={{ color: 'var(--accent-red)' }}>{formatCurrency(total)}</strong></p>
        </div>
        <button className="btn btn-danger" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Nova Despesa
        </button>
      </div>

      {showForm && (
        <div className="card mb-4 animate-fade" style={{ borderColor: 'var(--accent-red)' }}>
          <div className="section-title mb-3">Nova Despesa</div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Data</label>
              <input type="date" className="input" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Descrição</label>
              <input className="input" placeholder="Ex: Supermercado" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Categoria</label>
              <select className="input" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Tipo</label>
              <select className="input" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Valor (R$)</label>
              <input type="number" className="input" placeholder="0,00" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Pagamento</label>
              <select className="input" value={form.pagamento} onChange={e => setForm({ ...form, pagamento: e.target.value })}>
                {PAGAMENTOS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Observações</label>
              <input className="input" placeholder="Opcional" value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="btn btn-danger" onClick={handleAdd}>Salvar</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="card mb-4">
        <div className="form-row" style={{ gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" placeholder="Buscar..." style={{ paddingLeft: 30 }} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" value={filtCat} onChange={e => setFiltCat(e.target.value)}>
            <option value="">Categorias</option>
            {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="input" value={filtTipo} onChange={e => setFiltTipo(e.target.value)}>
            <option value="">Tipo</option>
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="input" value={filtStatus} onChange={e => setFiltStatus(e.target.value)}>
            <option value="">Status</option>
            {STATUS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="input" value={filtMes} onChange={e => setFiltMes(e.target.value)}>
            <option value="">Mês</option>
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
                <th>Tipo</th>
                <th>Pagamento</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Nenhum registro encontrado</td></tr>
              )}
              {filtered.map(d => (
                <tr key={d.id}>
                  <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(d.data)}</td>
                  <td style={{ fontWeight: 500 }}>{d.descricao}</td>
                  <td><span className="badge badge-red">{d.categoria}</span></td>
                  <td><span className={`badge ${tipoBadge[d.tipo] || 'badge-gray'}`}>{d.tipo}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{d.pagamento}</td>
                  <td>
                    <button
                      className={`badge ${d.status === 'Pago' ? 'badge-green' : 'badge-yellow'}`}
                      style={{ cursor: 'pointer', border: 'none', background: d.status === 'Pago' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)' }}
                      onClick={() => toggleStatus(d.id)}
                    >
                      {d.status}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-red)', whiteSpace: 'nowrap' }}>{formatCurrency(d.valor)}</td>
                  <td>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(d.id)} title="Excluir">
                      <Trash2 size={14} color="var(--accent-red)" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6} style={{ fontWeight: 700, paddingTop: 12, borderTop: '2px solid var(--border)' }}>Total</td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--accent-red)', fontSize: 15, borderTop: '2px solid var(--border)' }}>{formatCurrency(total)}</td>
                <td style={{ borderTop: '2px solid var(--border)' }}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
