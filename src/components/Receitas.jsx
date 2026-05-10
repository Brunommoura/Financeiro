import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Copy, Search, Settings } from 'lucide-react';
import { formatCurrency, formatDate, getMonthKey } from '../utils/helpers';

export default function Receitas({ receitas, setReceitas, categories, setCategories }) {
  const [showForm, setShowForm] = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [search, setSearch] = useState('');
  const [filtCat, setFiltCat] = useState('');
  const [filtMes, setFiltMes] = useState('');
  
  const [form, setForm] = useState({ 
    data: new Date().toISOString().split('T')[0], 
    descricao: '', categoria: categories.income[0]?.name || '', 
    valor: '', recorrente: false, observacoes: '' 
  });

  const [catForm, setCatForm] = useState({ name: '', color: '#10B981' });
  const [editingCatId, setEditingCatId] = useState(null);

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

  const handleOpenForm = (receita = null) => {
    if (receita) {
      setEditingId(receita.id);
      setForm({ ...receita, valor: receita.valor.toString() });
    } else {
      setEditingId(null);
      setForm({ 
        data: new Date().toISOString().split('T')[0], 
        descricao: '', categoria: categories.income[0]?.name || '', 
        valor: '', recorrente: false, observacoes: '' 
      });
    }
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.descricao || !form.valor || !form.data) return;
    
    const valor = parseFloat(form.valor);
    
    if (editingId) {
      setReceitas(prev => prev.map(r => r.id === editingId ? { ...form, id: r.id, valor } : r));
    } else {
      setReceitas(prev => [...prev, { ...form, id: Date.now(), valor }]);
    }
    setShowForm(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta receita?")) {
      setReceitas(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleDuplicate = (receita) => {
    const duplicated = { 
      ...receita, 
      id: Date.now(), 
      data: new Date().toISOString().split('T')[0],
      descricao: `${receita.descricao} (Cópia)`
    };
    setReceitas(prev => [...prev, duplicated]);
  };

  // Funções do Gerenciador de Categorias
  const handleSaveCategory = () => {
    if (!catForm.name || catForm.name.length < 3) {
      alert("O nome da categoria deve ter pelo menos 3 caracteres.");
      return;
    }
    const exists = categories.income.some(c => c.name.toLowerCase() === catForm.name.toLowerCase() && c.id !== editingCatId);
    if (exists) {
      alert("Já existe uma categoria com este nome.");
      return;
    }

    if (editingCatId) {
      // Se editou o nome, precisamos atualizar as receitas que usavam o nome antigo
      const oldCat = categories.income.find(c => c.id === editingCatId);
      if (oldCat.name !== catForm.name) {
        setReceitas(prev => prev.map(r => r.categoria === oldCat.name ? { ...r, categoria: catForm.name } : r));
      }
      setCategories(prev => ({
        ...prev,
        income: prev.income.map(c => c.id === editingCatId ? { ...c, name: catForm.name, color: catForm.color } : c)
      }));
    } else {
      setCategories(prev => ({
        ...prev,
        income: [...prev.income, { id: Date.now(), name: catForm.name, color: catForm.color }]
      }));
    }
    setCatForm({ name: '', color: '#10B981' });
    setEditingCatId(null);
  };

  const handleDeleteCategory = (cat) => {
    const inUse = receitas.filter(r => r.categoria === cat.name).length;
    if (inUse > 0) {
      alert(`Esta categoria está sendo usada em ${inUse} receita(s). Não é possível excluir.`);
      return;
    }
    if (window.confirm(`Deseja excluir a categoria "${cat.name}"?`)) {
      setCategories(prev => ({
        ...prev,
        income: prev.income.filter(c => c.id !== cat.id)
      }));
    }
  };

  const getCategoryColor = (name) => {
    const cat = categories.income.find(c => c.name === name);
    return cat ? cat.color : 'var(--accent-green)';
  };

  return (
    <div className="animate-fade">
      <div className="section-header mb-4">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Receitas</h1>
          <p className="text-secondary">Total filtrado: <strong style={{ color: 'var(--accent-green)' }}>{formatCurrency(total)}</strong></p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => setShowCatManager(true)}>
            <Settings size={16} /> Categorias
          </button>
          <button className="btn btn-success" onClick={() => handleOpenForm()}>
            <Plus size={16} /> Nova Receita
          </button>
        </div>
      </div>

      {showCatManager && (
        <div className="card mb-4 animate-fade" style={{ borderColor: 'var(--border)' }}>
          <div className="section-title mb-3">Gerenciar Categorias de Receitas</div>
          
          <div className="flex gap-2 mb-4">
            <input className="input" placeholder="Nome da Categoria" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} />
            <input type="color" className="input" style={{ padding: 4, height: 42, width: 60, cursor: 'pointer' }} value={catForm.color} onChange={e => setCatForm({...catForm, color: e.target.value})} />
            <button className="btn btn-primary" onClick={handleSaveCategory}>{editingCatId ? 'Atualizar' : 'Adicionar'}</button>
            {editingCatId && <button className="btn btn-ghost" onClick={() => { setEditingCatId(null); setCatForm({ name: '', color: '#10B981' }); }}>Cancelar</button>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {categories.income.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 6, borderLeft: `4px solid ${c.color}` }}>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</span>
                <div className="flex gap-1">
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditingCatId(c.id); setCatForm({ name: c.name, color: c.color }); }}>
                    <Edit2 size={14} color="var(--accent-blue)" />
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDeleteCategory(c)}>
                    <Trash2 size={14} color="var(--accent-red)" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex justify-end">
            <button className="btn btn-ghost" onClick={() => setShowCatManager(false)}>Fechar Gerenciador</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card mb-4 animate-fade" style={{ borderColor: 'var(--accent-green)' }}>
          <div className="section-title mb-3">{editingId ? 'Editar Receita' : 'Nova Receita'}</div>
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
                {categories.income.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                {!categories.income.some(c => c.name === form.categoria) && form.categoria && (
                   <option value={form.categoria}>{form.categoria} (Antiga)</option>
                )}
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
          <div className="flex gap-2 mt-4">
            <button className="btn btn-success" onClick={handleSave}>{editingId ? 'Salvar Alterações' : 'Salvar'}</button>
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
            {categories.income.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
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
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Nenhum registro encontrado</td></tr>
              )}
              {filtered.map(r => {
                const color = getCategoryColor(r.categoria);
                return (
                  <tr key={r.id} style={{ background: editingId === r.id ? 'rgba(16,185,129,0.05)' : 'transparent' }}>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(r.data)}</td>
                    <td style={{ fontWeight: 500 }}>{r.descricao}</td>
                    <td>
                      <span className="badge" style={{ background: `${color}15`, color: color, border: `1px solid ${color}30` }}>
                        {r.categoria}
                      </span>
                    </td>
                    <td><span className={`badge ${r.recorrente ? 'badge-blue' : 'badge-gray'}`}>{r.recorrente ? 'Sim' : 'Não'}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.observacoes || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-green)', whiteSpace: 'nowrap' }}>{formatCurrency(r.valor)}</td>
                    <td>
                      <div className="flex justify-center gap-1">
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleOpenForm(r)} title="Editar">
                          <Edit2 size={14} color="var(--text-secondary)" />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDuplicate(r)} title="Duplicar">
                          <Copy size={14} color="var(--text-secondary)" />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(r.id)} title="Excluir">
                          <Trash2 size={14} color="var(--accent-red)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
