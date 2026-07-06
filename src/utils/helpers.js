// Formata valor monetário em BRL
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value || 0);
};

// Formata percentual
export const formatPercent = (value, decimals = 1) => {
  return `${(value || 0).toFixed(decimals)}%`;
};

// Formata data de ISO para DD/MM/YYYY
// Normaliza qualquer data (com ou sem timestamp) para "YYYY-MM-DD"
// Evita problemas de fuso horário ao usar apenas a parte da data
export const toISODate = (value) => {
  if (!value) return '';
  // Se já é string, pegar só a parte antes do 'T'
  if (typeof value === 'string') {
    return value.split('T')[0];
  }
  // Se é objeto Date, montar manualmente em horário local (sem UTC shift)
  if (value instanceof Date && !isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return '';
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const datePart = String(dateStr).split('T')[0];
  const [y, m, d] = datePart.split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
};

// Converte DD/MM/YYYY para ISO
export const parseDate = (dateStr) => {
  if (!dateStr) return '';
  const [d, m, y] = dateStr.split('/');
  return `${y}-${m}-${d}`;
};

// Retorna o mês/ano de uma data ISO como string (ex: "2026-05")
export const getMonthKey = (dateStr) => dateStr?.slice(0, 7) || '';

// Calcula score de saúde financeira (0-1000)
export const calcFinancialScore = (receitas, despesas, patrimonio, dividas, metas) => {
  let score = 0;
  const totalReceitas = receitas.reduce((s, r) => s + r.valor, 0);
  const totalDespesas = despesas.reduce((s, d) => s + d.valor, 0);
  const taxaPoupanca = totalReceitas > 0 ? (totalReceitas - totalDespesas) / totalReceitas : 0;
  const totalPatrimonio = patrimonio.reduce((s, p) => s + p.valorAtual, 0);
  const totalDividas = dividas.reduce((s, d) => s + d.saldoDevedor, 0);
  const razaoDivida = totalPatrimonio > 0 ? totalDividas / totalPatrimonio : 1;

  // Taxa de poupança (0-300)
  if (taxaPoupanca >= 0.3) score += 300;
  else if (taxaPoupanca >= 0.2) score += 220;
  else if (taxaPoupanca >= 0.1) score += 150;
  else if (taxaPoupanca >= 0) score += 80;

  // Razão dívida/patrimônio (0-250)
  if (razaoDivida < 0.1) score += 250;
  else if (razaoDivida < 0.3) score += 180;
  else if (razaoDivida < 0.5) score += 100;
  else if (razaoDivida < 0.7) score += 40;

  // Metas (0-200)
  const metasConcluidas = metas.filter(m => m.acumulado >= m.valorAlvo).length;
  score += Math.min(200, metasConcluidas * 50 + metas.length * 20);

  // Investimentos vs Receita (0-150)
  const totalInvest = patrimonio.filter(p => p.tipo === 'Investimentos').reduce((s, p) => s + p.valorAtual, 0);
  const razaoInvest = totalReceitas > 0 ? totalInvest / (totalReceitas * 12) : 0;
  if (razaoInvest >= 12) score += 150;
  else if (razaoInvest >= 6) score += 100;
  else if (razaoInvest >= 3) score += 60;
  else score += 20;

  // Base (100 pontos)
  score += 100;

  return Math.min(1000, Math.round(score));
};

// Cor do score
export const getScoreColor = (score) => {
  if (score >= 800) return '#10b981';
  if (score >= 600) return '#3b82f6';
  if (score >= 400) return '#f59e0b';
  return '#ef4444';
};

// Label do score
export const getScoreLabel = (score) => {
  if (score >= 800) return 'Excelente';
  if (score >= 600) return 'Bom';
  if (score >= 400) return 'Regular';
  return 'Atenção';
};

// Gera ID único
export const genId = () => Date.now() + Math.random();

// Meses disponíveis a partir dos dados
export const getAvailableMonths = (receitas, despesas) => {
  const months = new Set();
  [...receitas, ...despesas].forEach(item => {
    const key = getMonthKey(item.data);
    if (key) months.add(key);
  });
  return Array.from(months).sort().reverse();
};

// Formata mês ISO para exibição
export const formatMonthLabel = (monthKey) => {
  const [y, m] = monthKey.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(m) - 1]}/${y}`;
};

export const calcNextInstallments = (parcelamentos, despesas) => {
  if (!despesas) return [];
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Despesas parceladas pendentes (vínculo correto: parcelamentoId)
  const novasPendentes = despesas
    .filter(d => d.tipo === 'Parcelada' && d.status === 'Pendente' && (d.parcelamentoId || d.installmentId))
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .map(d => {
      const vinculo = d.parcelamentoId || d.installmentId;
      const master = (parcelamentos || []).find(p => (p.id || p.$id) === vinculo);
      const match = (d.descricao || '').match(/Parcela (\d+\/\d+)/);
      return {
        id: d.id || d.$id,
        nome: master ? (master.descricao || master.description || master.nome) : (d.descricao || '').split(' -')[0],
        numeroParcela: match ? `Parcela ${match[1]}` : 'Parcela',
        proximaData: d.data,
        valorParcela: d.valor,
        parcelasRestantes: master
          ? despesas.filter(x => (x.parcelamentoId || x.installmentId) === vinculo && x.status === 'Pendente').length
          : 0
      };
    });

  if (novasPendentes.length > 0) return novasPendentes.slice(0, 30);

  // Fallback: calcular a partir dos parcelamentos master
  return (parcelamentos || [])
    .filter(p => (p.parcelasPagas || 0) < (p.numeroParcelas || p.parcelas || p.installmentCount || 0))
    .map(p => {
       const count = p.numeroParcelas || p.parcelas || p.installmentCount || 0;
       const pagas = p.parcelasPagas || 0;
       const firstDate = new Date(p.dataPrimeiraParcela || p.startDate || new Date().toISOString().split('T')[0]);
       const nextDate = new Date(firstDate);
       nextDate.setMonth(firstDate.getMonth() + pagas);
       return {
         id: p.id || p.$id,
         nome: p.descricao || p.description || p.nome,
         numeroParcela: `Parcela ${pagas + 1}/${count}`,
         proximaData: nextDate.toISOString().split('T')[0],
         valorParcela: p.valorParcela || p.installmentValue || 0,
         parcelasRestantes: count - pagas
       };
    })
    .sort((a, b) => new Date(a.proximaData) - new Date(b.proximaData))
    .slice(0, 30);
};