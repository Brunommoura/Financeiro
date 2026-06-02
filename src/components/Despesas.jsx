import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Copy, Search, Settings, CreditCard, Loader2, Upload } from 'lucide-react';
import { formatCurrency, formatDate, getMonthKey } from '../utils/helpers';
import { appwriteService } from '../services/appwriteService';
import { COLLECTIONS } from '../lib/appwrite';
import ImportModal from './ImportModal';

const TIPOS = ['Fixa', 'Variável', 'Parcelada'];
const PAGAMENTOS = ['Débito', 'Crédito', 'PIX', 'Dinheiro', 'Boleto'];
const STATUS = ['Pago', 'Pendente'];

export default function Despesas({ despesas, setDespesas, categories, setCategories, cartoes, user }) {
  const [showForm, setShowForm] = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [filtCat, setFiltCat] = useState('');
  const [filtTipo, setFiltTipo] = useState('');
  const [filtStatus, setFiltStatus] = useState('');
  const [filtMes, setFiltMes] = useState('');
  const [filtCartao, setFiltCartao] = useState('');

  const [form, setForm] = useState({
    data: new Date().toISOString().split('T')[0],
    descricao: '', categoria: categories.expense[0]?.name || '', 
    tipo: 'Fixa', valor: '', pagamento: 'Débito', 
    cartaoId: '', status: 'Pendente', observacoes: '',
    repetirAuto: false,
    tipoRecorrencia: 'indefinidamente', // 'data' ou 'indefinidamente'
    dataFimRecorrencia: ''
  });

  const [catForm, setCatForm] = useState({ name: '', color: '#EF4444' });
  const [editingCatId, setEditingCatId] = useState(null);

  const meses = useMemo(() => {
    const s = new Set(despesas.map(d => getMonthKey(d.data)));
    return Array.from(s).sort().reverse();
  }, [despesas]);

  const filtered = useMemo(() => despesas.filter(d => {
    if (filtCat && d.categoria !== filtCat) return false;
    if (filtTipo && d.tipo !== filtTipo) return false;
    if (filtStatus && d.status !== filtStatus) return false;
    if (filtMes && getMonthKey(d.data) !== filtMes) return false;
    if (filtCartao && String(d.cartaoId) !== String(filtCartao)) return false;
    if (search && !d.descricao.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [despesas, filtCat, filtTipo, filtStatus, filtMes, filtCartao, search]);

  const total = filtered.reduce((s, d) => s + d.valor, 0);

  const handleOpenForm = (despesa = null) => {
    if (despesa) {
      if (despesa.parcelamentoId || despesa.installmentId) {
        if (!window.confirm("Esta despesa faz parte de um parcelamento. Deseja editar apenas esta parcela? (Avisos de alteração geral devem ser feitos na aba Parcelamentos)")) {
          return;
        }
      }
      setEditingId(despesa.id);
      setForm({ ...despesa, valor: despesa.valor.toString(), cartaoId: despesa.cartaoId || '', repetirAuto: false, pagamento: despesa.formaPagamento || despesa.pagamento || 'Débito', tipoRecorrencia: 'indefinidamente', dataFimRecorrencia: '' });
    } else {
      setEditingId(null);
      setForm({ 
        data: new Date().toISOString().split('T')[0],
        descricao: '', categoria: categories.expense[0]?.name || '', 
        tipo: 'Fixa', valor: '', pagamento: 'Débito', 
        cartaoId: '', status: 'Pendente', observacoes: '', repetirAuto: false,
        tipoRecorrencia: 'indefinidamente', dataFimRecorrencia: ''
      });
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.descricao || !form.valor || !form.data) return;
    if (form.pagamento === 'Crédito' && !form.cartaoId) {
      alert("Por favor, selecione um cartão de crédito.");
      return;
    }

    setIsSaving(true);
    const valor = parseFloat(form.valor);
    const cartaoId = form.pagamento === 'Crédito' ? String(form.cartaoId) : null;
    
    const baseDoc = {
      data: form.data,
      descricao: form.descricao,
      categoria: form.categoria,
      tipo: form.tipo,
      valor,
      formaPagamento: form.pagamento,
      status: form.status,
      observacoes: form.observacoes
    };
    if (cartaoId) baseDoc.cartaoId = cartaoId;

    try {
      if (editingId) {
        await appwriteService.atualizar(COLLECTIONS.DESPESAS, editingId, baseDoc);
        setDespesas(prev => prev.map(d => d.id === editingId ? { ...d, ...baseDoc } : d));
      } else {
        if (form.tipo === 'Fixa' && form.repetirAuto) {
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
            current.setMonth(current.getMonth() + 1);
          }
          
          const savedDocs = await appwriteService.criarVarios(COLLECTIONS.DESPESAS, user.$id, documentsToCreate);
          setDespesas(prev => [...prev, ...savedDocs]);
          
          if (form.tipoRecorrencia === 'indefinidamente') {
            alert(`✅ Despesas geradas automaticamente até 31/12/${startDate.getFullYear()}. Lembre-se de registrar novamente no início do próximo ano.`);
          }
        } else {
          const newDoc = await appwriteService.criar(COLLECTIONS.DESPESAS, user.$id, baseDoc);
          setDespesas(prev => [...prev, newDoc]);
        }
      }
      setShowForm(false);
    } catch (e) {
      alert("Erro ao salvar despesa.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (despesa) => {
    let toDeleteIds = [despesa.id];

    if (despesa.parcelamentoId || despesa.installmentId) {
      if (!window.confirm("Esta despesa faz parte de um parcelamento. Excluir apenas esta parcela?")) return;
    } else if (despesa.recurrenceId) {
      const confirmAction = window.prompt("Esta despesa é recorrente.\nDigite '1' para excluir apenas esta.\nDigite '2' para excluir TODAS as futuras.\nDigite '3' para excluir TODAS.", "1");
      
      if (confirmAction === '2') {
        const futureDocs = despesas.filter(d => d.recurrenceId === despesa.recurrenceId && d.data >= despesa.data);
        toDeleteIds = futureDocs.map(d => d.id);
      } else if (confirmAction === '3') {
        const allDocs = despesas.filter(d => d.recurrenceId === despesa.recurrenceId);
        toDeleteIds = allDocs.map(d => d.id);
      } else if (confirmAction !== '1') {
        return; // cancelado
      }
    } else {
      if (!window.confirm("Deseja realmente excluir esta despesa?")) return;
    }

    try {
      await appwriteService.deletarVarios(COLLECTIONS.DESPESAS, toDeleteIds);
      setDespesas(prev => prev.filter(d => !toDeleteIds.includes(d.id)));
    } catch (e) {
      alert("Erro ao excluir do banco de dados.");
    }
  };

  const handleDuplicate = async (despesa) => {
    try {
      const duplicated = { 
        data: new Date().toISOString().split('T')[0],
        descricao: `${despesa.descricao} (Cópia)`,
        categoria: despesa.categoria,
        tipo: despesa.tipo,
        valor: despesa.valor,
        formaPagamento: despesa.formaPagamento || despesa.pagamento,
        status: despesa.status,
        observacoes: despesa.observacoes
      };
      if (despesa.cartaoId) duplicated.cartaoId = despesa.cartaoId;
      const newDoc = await appwriteService.criar(COLLECTIONS.DESPESAS, user.$id, duplicated);
      setDespesas(prev => [...prev, newDoc]);
    } catch (e) {
      alert("Erro ao duplicar despesa.");
    }
  };

  const toggleStatus = async (id) => {
    const despesa = despesas.find(d => d.id === id);
    if (!despesa) return;
    
    const newStatus = despesa.status === 'Pago' ? 'Pendente' : 'Pago';
    try {
      await appwriteService.atualizar(COLLECTIONS.DESPESAS, id, { status: newStatus });
      setDespesas(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
    } catch (e) {
      alert("Erro ao atualizar status.");
    }
  };

  const tipoBadge = { 'Fixa': 'badge-blue', 'Variável': 'badge-yellow', 'Parcelada': 'badge-purple' };

  // Funções do Gerenciador de Categorias
  const handleSaveCategory = () => {
    if (!catForm.name || catForm.name.length < 3) {
      alert("O nome da categoria deve ter pelo menos 3 caracteres.");
      return;
    }
    const exists = categories.expense.some(c => c.name.toLowerCase() === catForm.name.toLowerCase() && c.id !== editingCatId);
    if (exists) {
      alert("Já existe uma categoria com este nome.");
      return;
    }

    if (editingCatId) {
      const oldCat = categories.expense.find(c => c.id === editingCatId);
      if (oldCat.name !== catForm.name) {
        setDespesas(prev => prev.map(d => d.categoria === oldCat.name ? { ...d, categoria: catForm.name } : d));
      }
      setCategories(prev => ({
        ...prev,
        expense: prev.expense.map(c => c.id === editingCatId ? { ...c, name: catForm.name, color: catForm.color } : c)
      }));
    } else {
      setCategories(prev => ({
        ...prev,
        expense: [...prev.expense, { id: Date.now(), name: catForm.name, color: catForm.color }]
      }));
    }
    setCatForm({ name: '', color: '#EF4444' });
    setEditingCatId(null);
  };

  const handleDeleteCategory = (cat) => {
    const inUse = despesas.filter(d => d.categoria === cat.name).length;
    if (inUse > 0) {
      alert(`Esta categoria está sendo usada em ${inUse} despesa(s). Não é possível excluir.`);
      return;
    }
    if (window.confirm(`Deseja excluir a categoria "${cat.name}"?`)) {
      setCategories(prev => ({
        ...prev,
        expense: prev.expense.filter(c => c.id !== cat.id)
      }));
    }
  };

  const getCategoryColor = (name) => {
    const cat = categories.expense.find(c => c.name === name);
    return cat ? cat.color : 'var(--accent-red)';
  };

  return (
    <div className="animate-fade">
      <div className="section-header mb-4">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Despesas</h1>
          <p className="text-secondary">Total filtrado: <strong style={{ color: 'var(--accent-red)' }}>{formatCurrency(total)}</strong></p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
            <Upload size={16} /> Importar Planilha
          </button>
          <button className="btn btn-ghost" onClick={() => setShowCatManager(true)}>
            <Settings size={16} /> Categorias
          </button>
          <button className="btn btn-danger" onClick={() => handleOpenForm()}>
            <Plus size={16} /> Nova Despesa
          </button>
        </div>
      </div>

      <ImportModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
        initialType="despesas" 
        user={user} 
        setDespesas={setDespesas}
        onImportSuccess={() => {}} 
      />

      {showCatManager && (
        <div className="card mb-4 animate-fade" style={{ borderColor: 'var(--border)' }}>
          <div className="section-title mb-3">Gerenciar Categorias de Despesas</div>
          
          <div className="flex gap-2 mb-4">
            <input className="input" placeholder="Nome da Categoria" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} />
            <input type="color" className="input" style={{ padding: 4, height: 42, width: 60, cursor: 'pointer' }} value={catForm.color} onChange={e => setCatForm({...catForm, color: e.target.value})} />
            <button className="btn btn-primary" onClick={handleSaveCategory}>{editingCatId ? 'Atualizar' : 'Adicionar'}</button>
            {editingCatId && <button className="btn btn-ghost" onClick={() => { setEditingCatId(null); setCatForm({ name: '', color: '#EF4444' }); }}>Cancelar</button>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {categories.expense.map(c => (
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
        <div className="card mb-4 animate-fade" style={{ borderColor: 'var(--accent-red)' }}>
          <div className="section-title mb-3">{editingId ? 'Editar Despesa' : 'Nova Despesa'}</div>
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
                {categories.expense.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                {!categories.expense.some(c => c.name === form.categoria) && form.categoria && (
                   <option value={form.categoria}>{form.categoria} (Antiga)</option>
                )}
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
              <select className="input" value={form.pagamento} onChange={e => {
                setForm({ ...form, pagamento: e.target.value, cartaoId: e.target.value !== 'Crédito' ? '' : form.cartaoId });
              }}>
                {PAGAMENTOS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            
            {form.pagamento === 'Crédito' && (
              <div className="form-group">
                <label className="label">Cartão</label>
                <select className="input" value={form.cartaoId} onChange={e => setForm({ ...form, cartaoId: e.target.value })}>
                  <option value="">Selecione o Cartão...</option>
                  {cartoes.filter(c => c.active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

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
            
            {form.tipo === 'Fixa' && !editingId && (
              <div className="form-group" style={{ gridColumn: '1 / -1', background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, marginTop: 8 }}>
                <label className="label mb-3">Opções de Recorrência Automática:</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, marginBottom: form.repetirAuto ? 16 : 0 }}>
                  <input type="checkbox" checked={form.repetirAuto} onChange={e => setForm({...form, repetirAuto: e.target.checked})} style={{ width: 16, height: 16 }} />
                  <span>☑️ Tornar despesa recorrente</span>
                </label>
                
                {form.repetirAuto && (
                  <div style={{ display: 'flex', gap: 24, flexDirection: 'column' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                      <input type="radio" name="recTypeExp" checked={form.tipoRecorrencia === 'indefinidamente'} onChange={() => setForm({...form, tipoRecorrencia: 'indefinidamente'})} />
                      <span>♾️ Indefinidamente <span style={{fontSize: 12, color: 'var(--text-muted)'}}>(Gera despesas mensais até 31/12 do ano atual)</span></span>
                    </label>
                    
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                      <input type="radio" name="recTypeExp" checked={form.tipoRecorrencia === 'data'} onChange={() => setForm({...form, tipoRecorrencia: 'data'})} />
                      <span>⏰ Até qual data:</span>
                    </label>
                    
                    {form.tipoRecorrencia === 'data' && (
                      <input type="date" className="input" style={{ width: 200, marginLeft: 28 }} value={form.dataFimRecorrencia} onChange={e => setForm({...form, dataFimRecorrencia: e.target.value})} />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn btn-danger" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 size={16} className="spin" /> : (editingId ? 'Salvar Alterações' : 'Salvar')}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)} disabled={isSaving}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="card mb-4">
        <div className="form-row" style={{ gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr 1fr' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" placeholder="Buscar..." style={{ paddingLeft: 30 }} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" value={filtCat} onChange={e => setFiltCat(e.target.value)}>
            <option value="">Categorias</option>
            {categories.expense.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <select className="input" value={filtTipo} onChange={e => setFiltTipo(e.target.value)}>
            <option value="">Tipo</option>
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="input" value={filtStatus} onChange={e => setFiltStatus(e.target.value)}>
            <option value="">Status</option>
            {STATUS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="input" value={filtCartao} onChange={e => setFiltCartao(e.target.value)}>
            <option value="">Cartão (Todos)</option>
            {cartoes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Nenhum registro encontrado</td></tr>
              )}
              {filtered.map(d => {
                const cartao = d.cartaoId ? cartoes.find(c => String(c.id) === String(d.cartaoId)) : null;
                const color = getCategoryColor(d.categoria);
                
                return (
                  <tr key={d.id} style={{ background: editingId === d.id ? 'rgba(239,68,68,0.05)' : 'transparent' }}>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(d.data)}</td>
                    <td style={{ fontWeight: 500 }}>
                      {d.descricao}
                      {(d.parcelamentoId || d.installmentId) && <div className="text-xs text-muted">🔄 Parcela vinculada</div>}
                    </td>
                    <td>
                      <span className="badge" style={{ background: `${color}15`, color: color, border: `1px solid ${color}30` }}>
                        {d.categoria}
                      </span>
                    </td>
                    <td><span className={`badge ${tipoBadge[d.tipo] || 'badge-gray'}`}>{d.tipo}</span></td>
                    <td>
                      <div className="flex items-center gap-1">
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{d.formaPagamento || d.pagamento}</span>
                        {cartao && (
                          <span className="badge" style={{ padding: '2px 6px', fontSize: 10, background: `${cartao.color}20`, color: cartao.color }}>
                            <CreditCard size={10} style={{ marginRight: 2, display: 'inline' }}/> {cartao.name}
                          </span>
                        )}
                      </div>
                    </td>
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
                      <div className="flex justify-center gap-1">
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleOpenForm(d)} title="Editar">
                          <Edit2 size={14} color="var(--text-secondary)" />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDuplicate(d)} title="Duplicar">
                          <Copy size={14} color="var(--text-secondary)" />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(d)} title="Excluir">
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
