import { useMemo, useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, AlertTriangle, CheckCircle, Info, Minus } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Area, AreaChart, BarChart, Bar, ReferenceLine
} from 'recharts';
import { formatCurrency, formatPercent, getMonthKey, formatMonthLabel, calcNextInstallments } from '../utils/helpers';
import { account } from '../lib/appwrite';

const COLORS_RECEITA = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4'];
const COLORS_DESPESA = ['#ef4444', '#f97316', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#64748b'];

const CustomTooltipCurrency = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
        {label && <div style={{ color: 'var(--text-muted)', marginBottom: 4, fontSize: 11 }}>{label}</div>}
        {payload.map((entry, i) => (
          <div key={i} style={{ color: entry.color || 'var(--text-primary)', fontWeight: 600 }}>
            {entry.name}: {formatCurrency(entry.value)}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, name }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function Dashboard({ data, viewMode, setViewMode, selectedMonth, setSelectedMonth, availableMonths }) {
  const { receitas, despesas, patrimonio, dividasList, metas, tarefas, habitos, parcelamentos, patrimonioHistorico, aproveitamentoMensal, receitasDespesasMensais } = data;

  const [userName, setUserName] = useState('');

  useEffect(() => {
    account.get().then(u => {
      if (u && u.name) {
        setUserName(u.name.split(' ')[0]);
      }
    }).catch(e => console.error(e));
  }, []);

  // Evolução financeira mensal
  const evolucaoData = useMemo(() => {
    return (receitasDespesasMensais || []).map(m => ({ ...m, saldo: m.receitas - m.despesas }));
  }, [receitasDespesasMensais]);

  const evolucaoStats = useMemo(() => {
    if (!evolucaoData.length) return null;
    const melhor = evolucaoData.reduce((a, b) => b.saldo > a.saldo ? b : a);
    const pior = evolucaoData.reduce((a, b) => b.saldo < a.saldo ? b : a);
    const avgRec = evolucaoData.reduce((s, d) => s + d.receitas, 0) / evolucaoData.length;
    const avgDesp = evolucaoData.reduce((s, d) => s + d.despesas, 0) / evolucaoData.length;
    const len = evolucaoData.length;
    const trendRec = len >= 2 ? (evolucaoData[len-1].receitas > evolucaoData[len-2].receitas ? '↗' : evolucaoData[len-1].receitas < evolucaoData[len-2].receitas ? '↘' : '→') : '→';
    const trendDesp = len >= 2 ? (evolucaoData[len-1].despesas > evolucaoData[len-2].despesas ? '↗' : evolucaoData[len-1].despesas < evolucaoData[len-2].despesas ? '↘' : '→') : '→';
    return { melhor, pior, avgRec, avgDesp, trendRec, trendDesp };
  }, [evolucaoData]);

  // Aproveitamento mini-data
  const aprovData = useMemo(() => (aproveitamentoMensal || []).slice().sort((a, b) => a.id - b.id), [aproveitamentoMensal]);

  // Filter by month/view
  const filteredReceitas = useMemo(() =>
    viewMode === 'mensal'
      ? receitas.filter(r => getMonthKey(r.data) === selectedMonth)
      : receitas, [receitas, viewMode, selectedMonth]);

  const filteredDespesas = useMemo(() =>
    viewMode === 'mensal'
      ? despesas.filter(d => getMonthKey(d.data) === selectedMonth)
      : despesas, [despesas, viewMode, selectedMonth]);

  const totalReceitas = useMemo(() => filteredReceitas.reduce((s, r) => s + r.valor, 0), [filteredReceitas]);
  const totalDespesas = useMemo(() => filteredDespesas.reduce((s, d) => s + d.valor, 0), [filteredDespesas]);
  const saldo = totalReceitas - totalDespesas;
  const taxaPoupanca = totalReceitas > 0 ? (saldo / totalReceitas) * 100 : 0;
  const totalPatrimonio = patrimonio.reduce((s, p) => s + p.valorAtual, 0);
  const totalDividas = dividasList.reduce((s, d) => s + d.saldoDevedor, 0);

  // Pie data receitas
  const receitasByCategoria = useMemo(() => {
    const map = {};
    filteredReceitas.forEach(r => { map[r.categoria] = (map[r.categoria] || 0) + r.valor; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredReceitas]);

  // Pie data despesas
  const despesasByCategoria = useMemo(() => {
    const map = {};
    filteredDespesas.forEach(d => { map[d.categoria] = (map[d.categoria] || 0) + d.valor; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredDespesas]);

  // Despesas por tipo
  const despesasTipo = useMemo(() => {
    const fixas = filteredDespesas.filter(d => d.tipo === 'Fixa').reduce((s, d) => s + d.valor, 0);
    const variaveis = filteredDespesas.filter(d => d.tipo === 'Variável').reduce((s, d) => s + d.valor, 0);
    const parceladas = filteredDespesas.filter(d => d.tipo === 'Parcelada').reduce((s, d) => s + d.valor, 0);
    return { fixas, variaveis, parceladas };
  }, [filteredDespesas]);

  // Patrimônio por tipo
  const patrimonioByTipo = useMemo(() => {
    const map = {};
    patrimonio.forEach(p => { map[p.tipo] = (map[p.tipo] || 0) + p.valorAtual; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [patrimonio]);

  // Próximos parcelamentos
  const proxParcelamentos = useMemo(() => calcNextInstallments(parcelamentos, despesas), [parcelamentos, despesas]);

  // Alertas
  const alerts = useMemo(() => {
    const items = [];
    if (taxaPoupanca < 10 && totalReceitas > 0) items.push({ type: 'warning', msg: 'Taxa de poupança abaixo de 10%. Revise suas despesas.' });
    if (totalDividas > totalPatrimonio * 0.5) items.push({ type: 'danger', msg: 'Saldo de dívidas ultrapassou 50% do patrimônio.' });
    if (saldo > 0) items.push({ type: 'success', msg: `Você poupou ${formatCurrency(saldo)} neste período. Continue assim!` });
    const overDue = filteredDespesas.filter(d => d.status === 'Pendente');
    if (overDue.length > 0) items.push({ type: 'info', msg: `${overDue.length} despesa(s) pendente(s) de pagamento.` });
    return items;
  }, [taxaPoupanca, totalReceitas, totalDividas, totalPatrimonio, saldo, filteredDespesas]);

  // Produtividade
  const tarefasHoje = tarefas.filter(t => t.data === new Date().toISOString().split('T')[0]);
  const tarefasConcluidas = tarefas.filter(t => t.status === 'Concluída').length;
  const taxaConclusao = tarefas.length > 0 ? (tarefasConcluidas / tarefas.length) * 100 : 0;
  const streakMax = habitos.reduce((max, h) => Math.max(max, h.streak), 0);

  const prodData = [
    { name: 'Concluídas', value: tarefasConcluidas, fill: '#10b981' },
    { name: 'Pendentes', value: tarefas.filter(t => t.status === 'Pendente').length, fill: '#ef4444' },
    { name: 'Em Andamento', value: tarefas.filter(t => t.status === 'Em andamento').length, fill: '#f59e0b' },
  ];

  return (
    <div className="animate-fade">
      {/* Header */}
      <div className="section-header mb-6">
        <div>
          {userName && <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>Olá, {userName} 👋</div>}
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Dashboard Financeiro</h1>
          <p className="text-secondary">Visão completa das suas finanças pessoais</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="tabs" style={{ padding: 3, gap: 2 }}>
            <button className={`tab-btn ${viewMode === 'geral' ? 'active' : ''}`} onClick={() => setViewMode('geral')}>Visão Geral</button>
            <button className={`tab-btn ${viewMode === 'mensal' ? 'active' : ''}`} onClick={() => setViewMode('mensal')}>Mensal</button>
          </div>
          {viewMode === 'mensal' && (
            <select className="input" style={{ width: 'auto' }} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              {availableMonths.map(m => (
                <option key={m} value={m}>{formatMonthLabel(m)}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {alerts.map((a, i) => (
            <div key={i} className={`alert alert-${a.type}`}>
              {a.type === 'warning' && <AlertTriangle size={16} />}
              {a.type === 'danger' && <AlertTriangle size={16} />}
              {a.type === 'success' && <CheckCircle size={16} />}
              {a.type === 'info' && <Info size={16} />}
              {a.msg}
            </div>
          ))}
        </div>
      )}

      {/* Cards principais */}
      <div className="grid-4 mb-6">
        <div className="card" style={{ borderLeft: '3px solid var(--accent-green)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="icon-box" style={{ background: 'rgba(16,185,129,0.1)' }}>
              <TrendingUp size={20} color="var(--accent-green)" />
            </div>
            <span className="text-secondary" style={{ fontSize: 13 }}>Total Receitas</span>
          </div>
          <div className="metric-value text-green">{formatCurrency(totalReceitas)}</div>
          <div className="metric-sub mt-2">{filteredReceitas.length} lançamentos</div>
        </div>

        <div className="card" style={{ borderLeft: '3px solid var(--accent-red)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="icon-box" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <TrendingDown size={20} color="var(--accent-red)" />
            </div>
            <span className="text-secondary" style={{ fontSize: 13 }}>Total Despesas</span>
          </div>
          <div className="metric-value text-red">{formatCurrency(totalDespesas)}</div>
          <div className="metric-sub mt-2">{filteredDespesas.length} lançamentos</div>
        </div>

        <div className="card" style={{ borderLeft: `3px solid ${saldo >= 0 ? 'var(--accent-blue)' : 'var(--accent-red)'}` }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="icon-box" style={{ background: saldo >= 0 ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)' }}>
              <Wallet size={20} color={saldo >= 0 ? 'var(--accent-blue)' : 'var(--accent-red)'} />
            </div>
            <span className="text-secondary" style={{ fontSize: 13 }}>Saldo Líquido</span>
          </div>
          <div className="metric-value" style={{ color: saldo >= 0 ? 'var(--accent-blue)' : 'var(--accent-red)' }}>
            {formatCurrency(saldo)}
          </div>
          <div className="metric-sub mt-2">{saldo >= 0 ? '✓ Superávit' : '✗ Déficit'}</div>
        </div>

        <div className="card" style={{ borderLeft: '3px solid var(--accent-purple)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="icon-box" style={{ background: 'rgba(139,92,246,0.1)' }}>
              <PiggyBank size={20} color="var(--accent-purple)" />
            </div>
            <span className="text-secondary" style={{ fontSize: 13 }}>Taxa de Poupança</span>
          </div>
          <div className="metric-value" style={{ color: 'var(--accent-purple)' }}>{formatPercent(taxaPoupanca)}</div>
          <div className="metric-sub mt-2">Meta: &gt; 20%</div>
        </div>
      </div>

      {/* Gráficos Pizza */}
      <div className="grid-2 mb-6">
        <div className="card">
          <div className="section-header mb-3">
            <div className="section-title">Categorias de Receitas</div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={receitasByCategoria} cx="50%" cy="50%" outerRadius={90} dataKey="value" labelLine={false} label={CustomPieLabel}>
                {receitasByCategoria.map((_, i) => <Cell key={i} fill={COLORS_RECEITA[i % COLORS_RECEITA.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend formatter={(v, e) => `${v}: ${formatCurrency(e.payload.value)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-header mb-3">
            <div className="section-title">Categorias de Despesas</div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={despesasByCategoria} cx="50%" cy="50%" outerRadius={90} dataKey="value" labelLine={false} label={CustomPieLabel}>
                {despesasByCategoria.map((_, i) => <Cell key={i} fill={COLORS_DESPESA[i % COLORS_DESPESA.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend formatter={(v, e) => `${v}: ${formatCurrency(e.payload.value)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Evolução Financeira Mensal */}
      {evolucaoData.length > 0 && (
        <div className="card mb-6">
          <div className="section-header mb-4">
            <div className="section-title">📈 Evolução Financeira Mensal</div>
          </div>
          {evolucaoStats && (
            <div className="grid-3 mb-4" style={{ gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
              {[
                { label: 'Melhor Mês', value: evolucaoStats.melhor.mes, sub: formatCurrency(evolucaoStats.melhor.saldo), color: 'var(--accent-green)' },
                { label: 'Pior Mês', value: evolucaoStats.pior.mes, sub: formatCurrency(evolucaoStats.pior.saldo), color: 'var(--accent-red)' },
                { label: 'Tend. Receitas', value: evolucaoStats.trendRec, sub: '', color: evolucaoStats.trendRec === '↗' ? 'var(--accent-green)' : evolucaoStats.trendRec === '↘' ? 'var(--accent-red)' : 'var(--accent-yellow)' },
                { label: 'Tend. Despesas', value: evolucaoStats.trendDesp, sub: '', color: evolucaoStats.trendDesp === '↘' ? 'var(--accent-green)' : evolucaoStats.trendDesp === '↗' ? 'var(--accent-red)' : 'var(--accent-yellow)' },
                { label: 'Média Receitas', value: formatCurrency(evolucaoStats.avgRec), sub: '/mês', color: 'var(--accent-green)' },
                { label: 'Média Despesas', value: formatCurrency(evolucaoStats.avgDesp), sub: '/mês', color: 'var(--accent-red)' },
              ].map(s => (
                <div key={s.label} style={{ padding: 10, background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: s.value.length <= 2 ? 24 : 13, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div className="text-muted text-xs">{s.label}</div>
                  {s.sub && <div className="text-muted" style={{ fontSize: 10 }}>{s.sub}</div>}
                </div>
              ))}
            </div>
          )}
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={evolucaoData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltipCurrency />} />
              <Legend />
              <ReferenceLine y={0} stroke="var(--border)" />
              <Line type="monotone" dataKey="receitas" name="Receitas" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: 'var(--bg-card)' }} activeDot={{ r: 7 }} />
              <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#ef4444" strokeWidth={3} dot={{ r: 5, fill: '#ef4444', strokeWidth: 2, stroke: 'var(--bg-card)' }} activeDot={{ r: 7 }} />
              <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Análise de despesas + Parcelamentos futuros */}
      <div className="grid-2 mb-6">
        <div className="card">
          <div className="section-title mb-4">Análise por Tipo de Despesa</div>
          {[
            { label: 'Despesas Fixas', value: despesasTipo.fixas, color: 'var(--accent-blue)', icon: '🏠' },
            { label: 'Despesas Variáveis', value: despesasTipo.variaveis, color: 'var(--accent-yellow)', icon: '🛒' },
            { label: 'Despesas Parceladas', value: despesasTipo.parceladas, color: 'var(--accent-purple)', icon: '💳' },
          ].map(item => {
            const pct = totalDespesas > 0 ? (item.value / totalDespesas) * 100 : 0;
            return (
              <div key={item.label} style={{ marginBottom: 16 }}>
                <div className="flex justify-between items-center mb-2">
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{item.icon} {item.label}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: item.color }}>{formatCurrency(item.value)}</span>
                    <span className="text-muted" style={{ fontSize: 11, marginLeft: 6 }}>{formatPercent(pct)}</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: item.color }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="section-title mb-4">Próximos Parcelamentos</div>
          {proxParcelamentos.slice(0, 5).map(p => (
            <div key={p.id} className="stat-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.nome}</div>
                <div className="text-muted text-xs">{p.numeroParcela} · Vence {p.proximaData.split('-').reverse().join('/')}</div>
              </div>
              <div className="text-right">
                <div style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>{formatCurrency(p.valorParcela)}</div>
                <div className="text-muted text-xs">{p.parcelasRestantes} restantes</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(139,92,246,0.1)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Total próximo mês: <strong style={{ color: 'var(--accent-purple)' }}>
                {formatCurrency(proxParcelamentos.reduce((s, p) => s + p.valorParcela, 0))}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Patrimônio e Histórico */}
      <div className="grid-2 mb-6">
        <div className="card">
          <div className="section-title mb-3">Alocação Patrimonial</div>
          <div className="flex justify-between mb-3">
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Patrimônio Bruto</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--accent-green)' }}>{formatCurrency(totalPatrimonio)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Dívidas</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--accent-red)' }}>{formatCurrency(totalDividas)}</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={patrimonioByTipo} cx="50%" cy="50%" outerRadius={75} innerRadius={35} dataKey="value" labelLine={false} label={CustomPieLabel}>
                {patrimonioByTipo.map((_, i) => <Cell key={i} fill={COLORS_RECEITA[i % COLORS_RECEITA.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-title mb-3">Evolução Patrimonial</div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={patrimonioHistorico}>
              <defs>
                <linearGradient id="gradPatrim" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradLiq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltipCurrency />} />
              <Legend />
              <Area type="monotone" dataKey="patrimonio" name="Patrimônio" stroke="#3b82f6" fill="url(#gradPatrim)" strokeWidth={2} />
              <Area type="monotone" dataKey="liquido" name="Líquido" stroke="#10b981" fill="url(#gradLiq)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Produtividade */}
      <div className="grid-2 mb-6">
        <div className="card">
          <div className="section-title mb-4">Produtividade</div>
          <div className="grid-4" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
            <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-green)' }}>{tarefasConcluidas}</div>
              <div className="text-muted text-xs">Concluídas</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-yellow)' }}>{formatPercent(taxaConclusao, 0)}</div>
              <div className="text-muted text-xs">Taxa Conclusão</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-blue)' }}>{streakMax}</div>
              <div className="text-muted text-xs">Streak Max 🔥</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-purple)' }}>{habitos.filter(h => h.completadoHoje).length}</div>
              <div className="text-muted text-xs">Hábitos Hoje</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={prodData} layout="vertical">
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={90} />
              <Tooltip />
              <Bar dataKey="value" radius={4}>
                {prodData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {aprovData.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Aproveitamento Mensal</div>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={aprovData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="mesAno" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Line type="monotone" dataKey="aproveitamento" name="Aproveit." stroke="#8b5cf6" strokeWidth={2} dot={({ cx, cy, payload }) => {
                    const color = payload.aproveitamento >= 80 ? '#10b981' : payload.aproveitamento >= 60 ? '#f59e0b' : '#ef4444';
                    return <circle cx={cx} cy={cy} r={5} fill={color} stroke="none" />;
                  }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-title mb-4">Hábitos & Streaks</div>
          {habitos.map(h => (
            <div key={h.id} style={{ marginBottom: 14 }}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span>{h.completadoHoje ? '✅' : '⭕'}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{h.nome}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--accent-yellow)', fontWeight: 700 }}>🔥 {h.streak} dias</span>
              </div>
              <div className="progress-bar" style={{ height: 5 }}>
                <div className="progress-fill" style={{
                  width: `${Math.min(100, (h.streak / h.meta) * 100)}%`,
                  background: h.completadoHoje ? 'var(--accent-green)' : 'var(--accent-yellow)'
                }} />
              </div>
              <div className="text-muted text-xs mt-1">{h.streak}/{h.meta} dias</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
