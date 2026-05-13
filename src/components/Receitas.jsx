import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Copy, Search, Settings, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate, getMonthKey } from '../utils/helpers';
import { appwriteService } from '../services/appwriteService';
import { COLLECTIONS } from '../lib/appwrite';

export default function Receitas({ receitas, setReceitas, categories, setCategories, user }) {
  const [showForm, setShowForm] = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [search, setSearch] = useState('');
  const [filtCat, setFiltCat] = useState('');
  const [filtMes, setFiltMes] = useState('');
  
  const [form, setForm] = useState({ 
    data: new Date().toISOString().split('T')[0], 
    descricao: '', categoria: categories.income[0]?.name || '', 
    valor: '', recorrente: false, observacoes: '',
    tipoRecorrencia: 'indefinidamente', // 'data' ou 'indefinidamente'
    dataFimRecorrencia: ''
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
      setForm({ ...receita, valor: receita.valor.toString(), tipoRecorrencia: 'indefinidamente', dataFimRecorrencia: '' });
    } else {
      setEditingId(null);
      setForm({ 
        data: new Date().toISOString().split('T')[0], 
        descricao: '', categoria: categories.income[0]?.name || '', 
        valor: '', recorrente: false, observacoes: '',
        tipoRecorrencia: 'indefinidamente', dataFimRecorrencia: ''
      });
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.descricao || !form.valor || !form.data) return;
    
    setIsSaving(true);
    const valor = parseFloat(form.valor);
    const baseDoc = {
      data: form.data,
      descricao: form.descricao,
      categoria: form.categoria,
      valor,
      recorrente: form.recorrente,
      observacoes: form.observacoes
    };

    try {
      if (editingId) {
        await appwriteService.atualizar(COLLECTIONS.RECEITAS, editingId, baseDoc);
        setReceitas(prev => prev.map(r => r.id === editingId ? { ...r, ...baseDoc } : r));
      } else {
        if (form.recorrente) {
          const recurrenceId = `rec_${Date.now()}`;
          const startDate = new Date(form.data);
          let endDate;
          
          if (form.tipoRecorrencia === 'data' && form.dataFimRecorrencia) {
            endDate = new Date(form.dataFimRecorrencia);
          } else {
            endDate = new Date(startDate.getFullYear(), 11, 31); // 31/12 do ano atual
          }

          if (endDate < startDate) {
            alert("A data final não pode ser menor que a data inicial.");
            setIsSaving(false);
            return;
          }

          const documentsToCreate = [];
          let current = new Date(startDate);
          
          while (current <= endDate) {
            documentsToCreate.push({
              ...baseDoc,
              data: current.toISOString().split('T')[0],
              recurrenceId
            });
            // Adicionar 1 mês
            current.setMonth(current.getMonth() + 1);
          }
          
          // O ideal é usar createDocuments em batch se houver, ou Promise.all
          const savedDocs = await appwriteService.criarVarios(COLLECTIONS.RECEITAS, user.$id, documentsToCreate);
          setReceitas(prev => [...prev, ...savedDocs]);
          
          if (form.tipoRecorrencia === 'indefinidamente') {
            alert(`✅ Receitas geradas automaticamente até 31/12/${startDate.getFullYear()}. Lembre-se de registrar novamente no início do próximo ano.`);
          }
        } else {
          const newDoc = await appwriteService.criar(COLLECTIONS.RECEITAS, user.$id, baseDoc);
          setReceitas(prev => [...prev, newDoc]);
        }
      }
      setShowForm(false);
    } catch (e) {
      console.error("Erro ao salvar", e);
      alert("Erro ao salvar receita no banco de dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (receita) => {
    let toDeleteIds = [receita.id];
    
    if (receita.recurrenceId) {
      const confirmAction = window.prompt("Esta receita faz parte de uma recorrência.\nDigite '1' para excluir apenas esta.\nDigite '2' para excluir TODAS as recorrências futuras.\nDigite '3' para excluir TODAS as recorrências (passadas e futuras).", "1");
      
      if (confirmAction === '2') {
        const futureDocs = receitas.filter(r => r.recurrenceId === receita.recurrenceId && r.data >= receita.data);
        toDeleteIds = futureDocs.map(r => r.id);
      } else if (confirmAction === '3') {
        const allDocs = receitas.filter(r => r.recurrenceId === receita.recurrenceId);
        toDeleteIds = allDocs.map(r => r.id);
      } else if (confirmAction !== '1') {
        return; // cancelado
      }
    } else {
      if (!window.confirm("Tem certeza que deseja excluir esta receita?")) return;
    }

    try {
      await appwriteService.deletarVarios(COLLECTIONS.RECEITAS, toDeleteIds);
      setReceitas(prev => prev.filter(r => !toDeleteIds.includes(r.id)));
    } catch (e) {
      alert("Erro ao excluir do banco de dados.");
    }
  };

  const handleDuplicate = async (receita) => {
    try {
      const duplicated = { 
        data: new Date().toISOString().split('T')[0],
        descricao: `${receita.descricao} (Cópia)`,
        categoria: receita.categoria,
        valor: receita.valor,
        recorrente: false, // não clona a tag de recorrente
        observacoes: receita.observacoes
      };
      const newDoc = await appwriteService.criar(COLLECTIONS.RECEITAS, user.$id, duplicated);
      setReceitas(prev => [...prev, newDoc]);
    } catch (e) {
      alert("Erro ao duplicar receita.");
    }
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
            
            {form.recorrente && !editingId && (
              <div className="form-group" style={{ gridColumn: '1 / -1', background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, marginTop: 8 }}>
                <label className="label mb-3">Opções de Recorrência Automática:</label>
                <div style={{ display: 'flex', gap: 24, flexDirection: 'column' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input type="radio" name="recType" checked={form.tipoRecorrencia === 'indefinidamente'} onChange={() => setForm({...form, tipoRecorrencia: 'indefinidamente'})} />
                    <span>♾️ Indefinidamente <span style={{fontSize: 12, color: 'var(--text-muted)'}}>(Gera receitas mensais até 31/12 do ano atual)</span></span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input type="radio" name="recType" checked={form.tipoRecorrencia === 'data'} onChange={() => setForm({...form, tipoRecorrencia: 'data'})} />
                    <span>⏰ Até qual data:</span>
                  </label>
                  
                  {form.tipoRecorrencia === 'data' && (
                    <input type="date" className="input" style={{ width: 200, marginLeft: 28 }} value={form.dataFimRecorrencia} onChange={e => setForm({...form, dataFimRecorrencia: e.target.value})} />
                  )}
                </div>
              </div>
            )}
            
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn btn-success" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 size={16} className="spin" /> : (editingId ? 'Salvar Alterações' : 'Salvar')}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)} disabled={isSaving}>Cancelar</button>
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
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(r)} title="Excluir">
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
