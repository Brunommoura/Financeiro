// Dados de exemplo realistas para demonstração
export const sampleData = {
  categories: {
    income: [
      { id: 1, name: 'Salário', color: '#10B981' },
      { id: 2, name: 'Freelance', color: '#3B82F6' },
      { id: 3, name: 'Investimentos', color: '#8B5CF6' },
      { id: 4, name: 'Bônus', color: '#F59E0B' },
      { id: 5, name: 'Cashback', color: '#06B6D4' },
      { id: 6, name: 'Outros', color: '#6B7280' }
    ],
    expense: [
      { id: 1, name: 'Moradia', color: '#3B82F6' },
      { id: 2, name: 'Alimentação', color: '#F59E0B' },
      { id: 3, name: 'Transporte', color: '#6366F1' },
      { id: 4, name: 'Saúde', color: '#10B981' },
      { id: 5, name: 'Academia', color: '#8B5CF6' },
      { id: 6, name: 'Streaming', color: '#EC4899' },
      { id: 7, name: 'Pet Shop', color: '#F43F5E' },
      { id: 8, name: 'Outros', color: '#6B7280' }
    ]
  },
  cartoes: [
    { id: 1, name: 'Nubank', brand: 'Mastercard', lastDigits: '4567', limit: 5000, closingDay: 25, dueDay: 5, color: '#8B5CF6', active: true },
    { id: 2, name: 'Itaú Platinum', brand: 'Visa', lastDigits: '1234', limit: 8000, closingDay: 10, dueDay: 20, color: '#F97316', active: true },
    { id: 3, name: 'C6 Bank', brand: 'Mastercard', lastDigits: '9876', limit: 3000, closingDay: 15, dueDay: 25, color: '#1F2937', active: true }
  ],
  receitas: [
    { id: 1, data: '2026-02-05', descricao: 'Salário', categoria: 'Salário', valor: 8500, recorrente: true, observacoes: '' },
    { id: 2, data: '2026-02-10', descricao: 'Freelance Dev', categoria: 'Freelance', valor: 1200, recorrente: false, observacoes: 'Projeto website' },
    { id: 3, data: '2026-02-15', descricao: 'Dividendos', categoria: 'Investimentos', valor: 320, recorrente: false, observacoes: 'ITSA4' },
    { id: 4, data: '2026-03-05', descricao: 'Salário', categoria: 'Salário', valor: 8500, recorrente: true, observacoes: '' },
    { id: 5, data: '2026-03-12', descricao: 'Consultoria', categoria: 'Freelance', valor: 2000, recorrente: false, observacoes: '' },
    { id: 6, data: '2026-03-20', descricao: 'Rendimento CDB', categoria: 'Investimentos', valor: 410, recorrente: false, observacoes: '' },
    { id: 7, data: '2026-04-05', descricao: 'Salário', categoria: 'Salário', valor: 8500, recorrente: true, observacoes: '' },
    { id: 8, data: '2026-04-18', descricao: 'Cashback Cartão', categoria: 'Cashback', valor: 80, recorrente: false, observacoes: '' },
    { id: 9, data: '2026-04-22', descricao: 'Freelance Design', categoria: 'Freelance', valor: 800, recorrente: false, observacoes: '' },
    { id: 10, data: '2026-04-28', descricao: 'Dividendos', categoria: 'Investimentos', valor: 380, recorrente: false, observacoes: 'PETR4' },
    { id: 11, data: '2026-05-05', descricao: 'Salário', categoria: 'Salário', valor: 8500, recorrente: true, observacoes: '' },
    { id: 12, data: '2026-05-07', descricao: 'Bônus trimestral', categoria: 'Bônus', valor: 2500, recorrente: false, observacoes: '' },
    { id: 13, data: '2026-05-09', descricao: 'Rendimento Tesouro', categoria: 'Investimentos', valor: 290, recorrente: false, observacoes: '' },
  ],
  despesas: [
    { id: 1, data: '2026-05-05', descricao: 'Aluguel', categoria: 'Moradia', tipo: 'Fixa', valor: 2200, pagamento: 'Débito', status: 'Pago', observacoes: '' },
    { id: 2, data: '2026-05-07', descricao: 'Supermercado', categoria: 'Alimentação', tipo: 'Variável', valor: 590, pagamento: 'Crédito', cartaoId: 1, status: 'Pendente', observacoes: '' },
    { id: 3, data: '2026-05-08', descricao: 'Netflix/Streaming', categoria: 'Streaming', tipo: 'Fixa', valor: 85, pagamento: 'Crédito', cartaoId: 1, status: 'Pendente', observacoes: '' },
    { id: 4, data: '2026-05-15', descricao: 'Plano de Saúde', categoria: 'Saúde', tipo: 'Fixa', valor: 450, pagamento: 'Débito', status: 'Pendente', observacoes: '' },
    { id: 5, data: '2026-05-15', descricao: 'Academia', categoria: 'Academia', tipo: 'Fixa', valor: 130, pagamento: 'Débito', status: 'Pendente', observacoes: '' },
    { id: 6, data: '2026-05-20', descricao: 'Pet Shop Banho', categoria: 'Pet Shop', tipo: 'Variável', valor: 120, pagamento: 'Crédito', cartaoId: 3, status: 'Pendente', observacoes: '' },
    // Parcelamento 1: Notebook Dell
    { id: 101, installmentId: 1, data: '2026-01-10', descricao: 'Notebook Dell - Parcela 1/12', categoria: 'Outros', tipo: 'Parcelada', valor: 250, pagamento: 'Crédito', cartaoId: 2, status: 'Pago', observacoes: '' },
    { id: 102, installmentId: 1, data: '2026-02-10', descricao: 'Notebook Dell - Parcela 2/12', categoria: 'Outros', tipo: 'Parcelada', valor: 250, pagamento: 'Crédito', cartaoId: 2, status: 'Pago', observacoes: '' },
    { id: 103, installmentId: 1, data: '2026-03-10', descricao: 'Notebook Dell - Parcela 3/12', categoria: 'Outros', tipo: 'Parcelada', valor: 250, pagamento: 'Crédito', cartaoId: 2, status: 'Pago', observacoes: '' },
    { id: 104, installmentId: 1, data: '2026-04-10', descricao: 'Notebook Dell - Parcela 4/12', categoria: 'Outros', tipo: 'Parcelada', valor: 250, pagamento: 'Crédito', cartaoId: 2, status: 'Pago', observacoes: '' },
    { id: 105, installmentId: 1, data: '2026-05-10', descricao: 'Notebook Dell - Parcela 5/12', categoria: 'Outros', tipo: 'Parcelada', valor: 250, pagamento: 'Crédito', cartaoId: 2, status: 'Pago', observacoes: '' },
    { id: 106, installmentId: 1, data: '2026-06-10', descricao: 'Notebook Dell - Parcela 6/12', categoria: 'Outros', tipo: 'Parcelada', valor: 250, pagamento: 'Crédito', cartaoId: 2, status: 'Pendente', observacoes: '' },
    { id: 107, installmentId: 1, data: '2026-07-10', descricao: 'Notebook Dell - Parcela 7/12', categoria: 'Outros', tipo: 'Parcelada', valor: 250, pagamento: 'Crédito', cartaoId: 2, status: 'Pendente', observacoes: '' },
    { id: 108, installmentId: 1, data: '2026-08-10', descricao: 'Notebook Dell - Parcela 8/12', categoria: 'Outros', tipo: 'Parcelada', valor: 250, pagamento: 'Crédito', cartaoId: 2, status: 'Pendente', observacoes: '' },
    { id: 109, installmentId: 1, data: '2026-09-10', descricao: 'Notebook Dell - Parcela 9/12', categoria: 'Outros', tipo: 'Parcelada', valor: 250, pagamento: 'Crédito', cartaoId: 2, status: 'Pendente', observacoes: '' },
    { id: 110, installmentId: 1, data: '2026-10-10', descricao: 'Notebook Dell - Parcela 10/12', categoria: 'Outros', tipo: 'Parcelada', valor: 250, pagamento: 'Crédito', cartaoId: 2, status: 'Pendente', observacoes: '' },
    { id: 111, installmentId: 1, data: '2026-11-10', descricao: 'Notebook Dell - Parcela 11/12', categoria: 'Outros', tipo: 'Parcelada', valor: 250, pagamento: 'Crédito', cartaoId: 2, status: 'Pendente', observacoes: '' },
    { id: 112, installmentId: 1, data: '2026-12-10', descricao: 'Notebook Dell - Parcela 12/12', categoria: 'Outros', tipo: 'Parcelada', valor: 250, pagamento: 'Crédito', cartaoId: 2, status: 'Pendente', observacoes: '' },
    // Parcelamento 2: Curso de Python
    { id: 201, installmentId: 2, data: '2026-03-15', descricao: 'Curso de Python - Parcela 1/6', categoria: 'Outros', tipo: 'Parcelada', valor: 150, pagamento: 'Crédito', cartaoId: 1, status: 'Pago', observacoes: '' },
    { id: 202, installmentId: 2, data: '2026-04-15', descricao: 'Curso de Python - Parcela 2/6', categoria: 'Outros', tipo: 'Parcelada', valor: 150, pagamento: 'Crédito', cartaoId: 1, status: 'Pago', observacoes: '' },
    { id: 203, installmentId: 2, data: '2026-05-15', descricao: 'Curso de Python - Parcela 3/6', categoria: 'Outros', tipo: 'Parcelada', valor: 150, pagamento: 'Crédito', cartaoId: 1, status: 'Pendente', observacoes: '' },
    { id: 204, installmentId: 2, data: '2026-06-15', descricao: 'Curso de Python - Parcela 4/6', categoria: 'Outros', tipo: 'Parcelada', valor: 150, pagamento: 'Crédito', cartaoId: 1, status: 'Pendente', observacoes: '' },
    { id: 205, installmentId: 2, data: '2026-07-15', descricao: 'Curso de Python - Parcela 5/6', categoria: 'Outros', tipo: 'Parcelada', valor: 150, pagamento: 'Crédito', cartaoId: 1, status: 'Pendente', observacoes: '' },
    { id: 206, installmentId: 2, data: '2026-08-15', descricao: 'Curso de Python - Parcela 6/6', categoria: 'Outros', tipo: 'Parcelada', valor: 150, pagamento: 'Crédito', cartaoId: 1, status: 'Pendente', observacoes: '' },
    // Parcelamento 3: Geladeira Brastemp
    { id: 301, installmentId: 3, data: '2026-02-05', descricao: 'Geladeira Brastemp - Parcela 1/10', categoria: 'Outros', tipo: 'Parcelada', valor: 180, pagamento: 'Crédito', cartaoId: 3, status: 'Pago', observacoes: '' },
    { id: 302, installmentId: 3, data: '2026-03-05', descricao: 'Geladeira Brastemp - Parcela 2/10', categoria: 'Outros', tipo: 'Parcelada', valor: 180, pagamento: 'Crédito', cartaoId: 3, status: 'Pago', observacoes: '' },
    { id: 303, installmentId: 3, data: '2026-04-05', descricao: 'Geladeira Brastemp - Parcela 3/10', categoria: 'Outros', tipo: 'Parcelada', valor: 180, pagamento: 'Crédito', cartaoId: 3, status: 'Pago', observacoes: '' },
    { id: 304, installmentId: 3, data: '2026-05-05', descricao: 'Geladeira Brastemp - Parcela 4/10', categoria: 'Outros', tipo: 'Parcelada', valor: 180, pagamento: 'Crédito', cartaoId: 3, status: 'Pago', observacoes: '' },
    { id: 305, installmentId: 3, data: '2026-06-05', descricao: 'Geladeira Brastemp - Parcela 5/10', categoria: 'Outros', tipo: 'Parcelada', valor: 180, pagamento: 'Crédito', cartaoId: 3, status: 'Pendente', observacoes: '' },
    { id: 306, installmentId: 3, data: '2026-07-05', descricao: 'Geladeira Brastemp - Parcela 6/10', categoria: 'Outros', tipo: 'Parcelada', valor: 180, pagamento: 'Crédito', cartaoId: 3, status: 'Pendente', observacoes: '' },
    { id: 307, installmentId: 3, data: '2026-08-05', descricao: 'Geladeira Brastemp - Parcela 7/10', categoria: 'Outros', tipo: 'Parcelada', valor: 180, pagamento: 'Crédito', cartaoId: 3, status: 'Pendente', observacoes: '' },
    { id: 308, installmentId: 3, data: '2026-09-05', descricao: 'Geladeira Brastemp - Parcela 8/10', categoria: 'Outros', tipo: 'Parcelada', valor: 180, pagamento: 'Crédito', cartaoId: 3, status: 'Pendente', observacoes: '' },
    { id: 309, installmentId: 3, data: '2026-10-05', descricao: 'Geladeira Brastemp - Parcela 9/10', categoria: 'Outros', tipo: 'Parcelada', valor: 180, pagamento: 'Crédito', cartaoId: 3, status: 'Pendente', observacoes: '' },
    { id: 310, installmentId: 3, data: '2026-11-05', descricao: 'Geladeira Brastemp - Parcela 10/10', categoria: 'Outros', tipo: 'Parcelada', valor: 180, pagamento: 'Crédito', cartaoId: 3, status: 'Pendente', observacoes: '' }
  ],
  parcelamentos: [
    {
      id: 1, description: 'Notebook Dell', totalValue: 3000, installmentCount: 12, installmentValue: 250,
      startDate: '2026-01-10', cardId: 2, category: 'Outros', status: 'active', notes: ''
    },
    {
      id: 2, description: 'Curso de Python', totalValue: 900, installmentCount: 6, installmentValue: 150,
      startDate: '2026-03-15', cardId: 1, category: 'Outros', status: 'active', notes: ''
    },
    {
      id: 3, description: 'Geladeira Brastemp', totalValue: 1800, installmentCount: 10, installmentValue: 180,
      startDate: '2026-02-05', cardId: 3, category: 'Outros', status: 'active', notes: ''
    },
  ],
  aproveitamentoMensal: [
    { id: 1, mesAno: 'Dez/2025', aproveitamento: 75, observacoes: '' },
    { id: 2, mesAno: 'Jan/2026', aproveitamento: 82, observacoes: '' },
    { id: 3, mesAno: 'Fev/2026', aproveitamento: 78, observacoes: '' },
    { id: 4, mesAno: 'Mar/2026', aproveitamento: 88, observacoes: '' },
    { id: 5, mesAno: 'Abr/2026', aproveitamento: 85, observacoes: '' },
    { id: 6, mesAno: 'Mai/2026', aproveitamento: 90, observacoes: '' },
  ],
  receitasDespesasMensais: [
    { mes: 'Dez/25', receitas: 9500, despesas: 7800 },
    { mes: 'Jan/26', receitas: 10200, despesas: 8500 },
    { mes: 'Fev/26', receitas: 9800, despesas: 7200 },
    { mes: 'Mar/26', receitas: 11500, despesas: 9100 },
    { mes: 'Abr/26', receitas: 10000, despesas: 8800 },
    { mes: 'Mai/26', receitas: 10500, despesas: 8300 },
  ],
  patrimonio: [
    { id: 1, tipo: 'Conta Corrente', instituicao: 'Nubank', descricao: 'Conta principal', valorAtual: 8200, variacaoMensal: 1200 },
    { id: 2, tipo: 'Poupança', instituicao: 'Itaú', descricao: 'Reserva emergência', valorAtual: 24000, variacaoMensal: 180 },
    { id: 3, tipo: 'Investimentos', instituicao: 'XP Investimentos', descricao: 'CDB/Tesouro/Ações', valorAtual: 87500, variacaoMensal: 3200 },
    { id: 4, tipo: 'Imóvel', instituicao: 'Próprio', descricao: 'Apartamento 2 quartos', valorAtual: 420000, variacaoMensal: 2100 },
    { id: 5, tipo: 'Veículo', instituicao: 'Próprio', descricao: 'Honda Civic 2023', valorAtual: 98000, variacaoMensal: -800 }
  ],
  dividasList: [
    {
      id: 1, tipo: 'Financiamento', credor: 'Banco do Brasil', valorOriginal: 280000,
      saldoDevedor: 198000, taxaJuros: 8.5, parcelaMensal: 2100, dataQuitacao: '2035-06-01', descricao: 'Financiamento imóvel'
    }
  ],
  metas: [
    { id: 1, nome: 'Viagem Europa', valorAlvo: 25000, prazo: '2027-07-01', acumulado: 8500, descricao: 'Férias na Europa com família' }
  ],
  tarefas: [
    { id: 1, titulo: 'Revisar declaração de IR', categoria: 'Financeiro', prioridade: 'Alta', status: 'Pendente', tempoEstimado: 120, tempoReal: 0, data: '2026-05-09' }
  ],
  habitos: [
    { id: 1, nome: 'Exercício físico', streak: 14, meta: 30, completadoHoje: true }
  ],
  patrimonioHistorico: [
    { mes: 'Dez/25', patrimonio: 598000, dividas: 248000, liquido: 350000 },
    { mes: 'Jan/26', patrimonio: 609000, dividas: 245000, liquido: 364000 },
    { mes: 'Fev/26', patrimonio: 621000, dividas: 242000, liquido: 379000 },
    { mes: 'Mar/26', patrimonio: 637000, dividas: 239800, liquido: 397200 },
    { mes: 'Abr/26', patrimonio: 648000, dividas: 238000, liquido: 410000 },
    { mes: 'Mai/26', patrimonio: 653300, dividas: 243800, liquido: 409500 },
  ],
};
