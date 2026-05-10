import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, CreditCard, ChevronDown, ChevronUp, DollarSign, XCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function Parcelamentos({ parcelamentos, setParcelamentos, despesas, setDespesas, cartoes, categories }) {
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    description: '', totalValue: '', installmentCount: '', startDate: new Date().toISOString().split('T')[0],
    cardId: '', category: 'Outros', notes: ''
  });

  const handleOpenForm = (parcelamento = null) => {
    if (parcelamento) {
      setEditingId(parcelamento.id);
      const desc = parcelamento.description || parcelamento.nome || '';
      const total = parcelamento.totalValue || parcelamento.valorTotal || 0;
      const count = parcelamento.installmentCount || parcelamento.parcelas || 0;
      setForm({ ...parcelamento, description: desc, totalValue: total.toString(), installmentCount: count.toString(), cardId: parcelamento.cardId || '' });
    } else {
      setEditingId(null);
      setForm({ description: '', totalValue: '', installmentCount: '', startDate: new Date().toISOString().split('T')[0], cardId: '', category: 'Outros', notes: '' });
    }
    setShowForm(true);
  };

  const handleDeleteMaster = (id) => {
    if (window.confirm("Deseja excluir permanentemente este registro de parcelamento? As despesas geradas não serão apagadas automaticamente nesta ação.")) {
      setParcelamentos(prev => prev.filter(p => p.id !== id));
    }
  };

  const generateInstallmentDates = (startDate, count) => {
    const dates = [];
    let current = new Date(startDate);
    const day = current.getUTCDate();
    for (let i = 0; i < count; i++) {
      dates.push(current.toISOString().split('T')[0]);
      
      // Calculate next month maintaining the day, handling edge cases like Jan 31 -> Feb 28
      let nextMonth = current.getUTCMonth() + 1;
      let nextYear = current.getUTCFullYear();
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear++;
      }
      current = new Date(Date.UTC(nextYear, nextMonth, day));
      // if month rolled over too far (e.g., trying to set Feb 31 resulted in Mar 3)
      if (current.getUTCMonth() !== nextMonth) {
        current = new Date(Date.UTC(nextYear, nextMonth + 1, 0)); // last day of nextMonth
      }
    }
    return dates;
  };

  const handleSave = () => {
    if (!form.description || !form.totalValue || !form.installmentCount || !form.cardId) {
      alert("Preencha todos os campos obrigatórios (Descrição, Valor, Parcelas, Cartão).");
      return;
    }

    if (editingId) {
      // Edição de informações básicas (NÃO recria financeiro)
      setParcelamentos(prev => prev.map(p => p.id === editingId ? { ...p, description: form.description, category: form.category, notes: form.notes } : p));
      
      // Atualizar as despesas filhas (Apenas campos não financeiros)
      setDespesas(prev => prev.map(d => {
        if (d.installmentId === editingId) {
          // Atualiza a descrição base mantendo o final " - Parcela X/Y"
          const match = d.descricao.match(/(.*) - Parcela (\d+\/\d+)/);
          const newDesc = match ? `${form.description} - Parcela ${match[2]}` : `${form.description} (Atualizada)`;
          return { ...d, descricao: newDesc, categoria: form.category };
        }
        return d;
      }));
    } else {
      // Novo parcelamento: Criação do mestre e filhas
      const totalValue = parseFloat(form.totalValue);
      const installmentCount = parseInt(form.installmentCount);
      const installmentValue = parseFloat((totalValue / installmentCount).toFixed(2));
      const newId = Date.now();
      
      const newMaster = {
        ...form, id: newId, totalValue, installmentCount, installmentValue,
        cardId: Number(form.cardId), status: 'active'
      };
      
      setParcelamentos(prev => [...prev, newMaster]);

      // Gerar as N despesas
      const dates = generateInstallmentDates(form.startDate, installmentCount);
      let cumulativeValue = 0;
      
      const newDespesas = dates.map((date, index) => {
        // Ajuste de centavos na última parcela
        let val = installmentValue;
        if (index === installmentCount - 1) {
          val = parseFloat((totalValue - cumulativeValue).toFixed(2));
        } else {
          cumulativeValue += val;
        }

        return {
          id: Date.now() + index, // unique ID hack
          installmentId: newId,
          data: date,
          descricao: `${form.description} - Parcela ${index + 1}/${installmentCount}`,
          categoria: form.category,
          tipo: 'Parcelada',
          valor: val,
          pagamento: 'Crédito',
          cartaoId: Number(form.cardId),
          status: 'Pendente',
          observacoes: form.notes
        };
      });

      setDespesas(prev => [...prev, ...newDespesas]);
    }
    setShowForm(false);
  };

  const handleCancel = (parcelamentoId) => {
    if (window.confirm("Deseja realmente cancelar este parcelamento? Isso irá excluir todas as parcelas pendentes futuras.")) {
      setParcelamentos(prev => prev.map(p => p.id === parcelamentoId ? { ...p, status: 'cancelled' } : p));
      setDespesas(prev => prev.filter(d => !(d.installmentId === parcelamentoId && d.status === 'Pendente')));
    }
  };

  const handleQuitar = (parcelamento) => {
    const pendentes = despesas.filter(d => d.installmentId === parcelamento.id && d.status === 'Pendente');
    const valorRestante = pendentes.reduce((s, d) => s + d.valor, 0);
    
    if (pendentes.length === 0) {
      alert("Não há parcelas pendentes para quitar.");
      return;
    }

    const valorQuitacao = window.prompt(`Restam ${pendentes.length} parcelas no valor total de ${formatCurrency(valorRestante)}.\n\nSe teve desconto, informe o valor da quitação (R$):`, valorRestante.toString());
    
    if (valorQuitacao !== null && !isNaN(parseFloat(valorQuitacao))) {
      // Apagar pendentes
      setDespesas(prev => prev.filter(d => !(d.installmentId === parcelamento.id && d.status === 'Pendente')));
      
      // Criar despesa de quitação
      setDespesas(prev => [...prev, {
        id: Date.now(),
        installmentId: parcelamento.id,
        data: new Date().toISOString().split('T')[0],
        descricao: `${parcelamento.description} - Quitação Antecipada`,
        categoria: parcelamento.category,
        tipo: 'Parcelada',
        valor: parseFloat(valorQuitacao),
        pagamento: 'Crédito',
        cartaoId: parcelamento.cardId,
        status: 'Pago',
        observacoes: 'Quitação antecipada'
      }]);

      setParcelamentos(prev => prev.map(p => p.id === parcelamento.id ? { ...p, status: 'completed' } : p));
    }
  };

  const markParcelaAsPaid = (despesaId) => {
    setDespesas(prev => prev.map(d => d.id === despesaId ? { ...d, status: 'Pago' } : d));
  };

  // Calcular métricas ativas do Dashboard
  const activeMaster = parcelamentos.filter(p => p.status === 'active');
  const totalValueActive = activeMaster.reduce((s, p) => {
    const pendentes = despesas.filter(d => d.installmentId === p.id && d.status === 'Pendente');
    return s + pendentes.reduce((s2, d) => s2 + d.valor, 0);
  }, 0);

  return (
    <div className="animate-fade">
      <div className="section-header mb-4">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Parcelamentos</h1>
          <p className="text-secondary">Controle e automatização de compras parceladas</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenForm()}>
          <Plus size={16} /> Novo Parcelamento
        </button>
      </div>

      <div className="grid-4 mb-6">
        <div className="card text-center">
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-purple)' }}>{activeMaster.length}</div>
          <div className="text-muted text-xs">Parcelamentos Ativos</div>
        </div>
        <div className="card text-center">
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-red)' }}>{formatCurrency(totalValueActive)}</div>
          <div className="text-muted text-xs">Total a Pagar (Futuro)</div>
        </div>
      </div>

      {showForm && (
        <div className="card mb-6 animate-fade" style={{ borderColor: 'var(--accent-purple)' }}>
          <div className="section-title mb-3">{editingId ? 'Editar Parcelamento' : 'Novo Parcelamento'}</div>
          {editingId && (
            <div className="alert alert-warning mb-3" style={{ fontSize: 12 }}>
              Aviso: A edição aqui modifica apenas Descrição e Categoria de todas as parcelas. Para mudar valores ou datas, é necessário cancelar e recriar.
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label className="label">Descrição do Item</label>
              <input className="input" placeholder="Ex: Notebook Dell" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            {!editingId && (
              <>
                <div className="form-group">
                  <label className="label">Valor Total (R$)</label>
                  <input type="number" className="input" value={form.totalValue} onChange={e => setForm({ ...form, totalValue: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="label">Número de Parcelas</label>
                  <input type="number" className="input" min="2" max="60" value={form.installmentCount} onChange={e => setForm({ ...form, installmentCount: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="label">Data Primeira Parcela</label>
                  <input type="date" className="input" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                </div>
              </>
            )}
            <div className="form-group">
              <label className="label">Cartão Utilizado</label>
              <select className="input" disabled={editingId} value={form.cardId} onChange={e => setForm({ ...form, cardId: e.target.value })}>
                <option value="">Selecione...</option>
                {cartoes.filter(c => c.active || c.id === form.cardId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Categoria</label>
              <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.expense.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="label">Observações</label>
              <input className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn btn-primary" onClick={handleSave}>{editingId ? 'Salvar Edição' : 'Gerar Parcelas'}</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {parcelamentos.map(p => {
          const cartao = cartoes.find(c => c.id === p.cardId);
          const filhas = despesas.filter(d => d.installmentId === p.id).sort((a,b) => new Date(a.data) - new Date(b.data));
          
          const parcelasPagas = filhas.filter(d => d.status === 'Pago').length;
          const totalPago = filhas.filter(d => d.status === 'Pago').reduce((s, d) => s + d.valor, 0);
          
          const pendentes = filhas.filter(d => d.status === 'Pendente');
          const totalRestante = pendentes.reduce((s, d) => s + d.valor, 0);
          
          const isCompleted = p.status === 'completed' || (filhas.length > 0 && pendentes.length === 0 && p.status === 'active');
          const statusVisual = p.status === 'cancelled' ? 'Cancelado' : isCompleted ? 'Concluído' : 'Ativo';
          const statusColor = p.status === 'cancelled' ? 'var(--accent-red)' : isCompleted ? 'var(--accent-blue)' : 'var(--accent-green)';
          
          const totalEsperado = p.totalValue || p.valorTotal || 0;
          const pct = Math.min(100, totalEsperado > 0 ? (totalPago / totalEsperado) * 100 : 0);
          
          const nomeParcelamento = p.description || p.nome || 'Parcelamento';

          return (
            <div key={p.id} className="card" style={{ borderLeft: `4px solid ${statusColor}`, opacity: p.status === 'cancelled' ? 0.6 : 1 }}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div className="icon-box" style={{ background: `${statusColor}20` }}>
                    <CreditCard size={20} color={statusColor} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontWeight: 700, fontSize: 16 }}>{nomeParcelamento}</span>
                      <span className="badge" style={{ background: `${statusColor}20`, color: statusColor, fontSize: 10 }}>{statusVisual}</span>
                    </div>
                    <div className="text-muted text-xs mt-1">
                      {cartao?.name || 'Cartão'} · Início em {formatDate(p.startDate || p.dataPrimeiraParcela)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-ghost btn-sm" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                    {expandedId === p.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />} Detalhes
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleOpenForm(p)}>
                    <Edit2 size={14} color="var(--accent-blue)" />
                  </button>
                  {p.status === 'active' && pendentes.length > 0 && (
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleQuitar(p)} title="Quitar Antecipadamente">
                      <DollarSign size={14} color="var(--accent-green)" />
                    </button>
                  )}
                  {p.status === 'active' && pendentes.length > 0 ? (
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleCancel(p.id)} title="Cancelar Restantes">
                      <XCircle size={14} color="var(--accent-red)" />
                    </button>
                  ) : (
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDeleteMaster(p.id)} title="Excluir">
                      <Trash2 size={14} color="var(--accent-red)" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid-4 mb-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div style={{ textAlign: 'center', padding: 10, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div style={{ fontWeight: 700 }}>{formatCurrency(totalEsperado)}</div>
                  <div className="text-xs text-muted">Valor Original</div>
                </div>
                <div style={{ textAlign: 'center', padding: 10, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{filhas.length > 0 ? parcelasPagas : (p.parcelasPagas || 0)} / {p.installmentCount || p.parcelas || 0}</div>
                  <div className="text-xs text-muted">Parcelas Pagas</div>
                </div>
                <div style={{ textAlign: 'center', padding: 10, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{formatCurrency(filhas.length > 0 ? totalPago : ((p.valorParcela || 0) * (p.parcelasPagas || 0)))}</div>
                  <div className="text-xs text-muted">Já Pago</div>
                </div>
                <div style={{ textAlign: 'center', padding: 10, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-red)' }}>{formatCurrency(filhas.length > 0 ? totalRestante : totalEsperado - ((p.valorParcela || 0) * (p.parcelasPagas || 0)))}</div>
                  <div className="text-xs text-muted">Em Aberto</div>
                </div>
              </div>

              <div className="progress-bar mb-2" style={{ background: 'var(--border-light)' }}>
                <div className="progress-fill" style={{ width: `${pct}%`, background: statusColor }} />
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>{pct.toFixed(0)}% pago</span>
                <span>Restam {pendentes.length} parcelas</span>
              </div>

              {expandedId === p.id && (
                <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Detalhamento das Parcelas (Geradas em Despesas):</div>
                  <div style={{ maxHeight: 250, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                          <th style={{ padding: '8px 4px', color: 'var(--text-muted)' }}>Data</th>
                          <th style={{ padding: '8px 4px', color: 'var(--text-muted)' }}>Descrição</th>
                          <th style={{ padding: '8px 4px', color: 'var(--text-muted)', textAlign: 'right' }}>Valor</th>
                          <th style={{ padding: '8px 4px', color: 'var(--text-muted)', textAlign: 'center' }}>Status</th>
                          <th style={{ padding: '8px 4px', color: 'var(--text-muted)' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filhas.map(d => (
                          <tr key={d.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '8px 4px' }}>{formatDate(d.data)}</td>
                            <td style={{ padding: '8px 4px', fontWeight: 500 }}>{d.descricao}</td>
                            <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(d.valor)}</td>
                            <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                              <span className="badge" style={{ 
                                background: d.status === 'Pago' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                color: d.status === 'Pago' ? 'var(--accent-green)' : 'var(--accent-yellow)'
                              }}>
                                {d.status}
                              </span>
                            </td>
                            <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                              {d.status === 'Pendente' && (
                                <button className="btn btn-ghost btn-sm" onClick={() => markParcelaAsPaid(d.id)}>
                                  Marcar Paga
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filhas.length === 0 && (
                          <tr><td colSpan={5} style={{ textAlign: 'center', padding: 12, color: 'var(--text-muted)' }}>Nenhuma parcela gerada ou todas foram excluídas.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {parcelamentos.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            Nenhum parcelamento cadastrado.
          </div>
        )}
      </div>
    </div>
  );
}
