// Dados de exemplo realistas para demonstração
export const sampleData = {
  receitas: [
    { id: 1, data: '2026-02-05', descricao: 'Salário', categoria: 'Salário', valor: 8500, recorrente: true, observacoes: '' },
    { id: 2, data: '2026-02-10', descricao: 'Freelance Dev', categoria: 'Freelance', valor: 1200, recorrente: false, observacoes: 'Projeto website' },
    { id: 3, data: '2026-02-15', descricao: 'Dividendos', categoria: 'Investimentos', valor: 320, recorrente: false, observacoes: 'ITSA4' },
    { id: 4, data: '2026-03-05', descricao: 'Salário', categoria: 'Salário', valor: 8500, recorrente: true, observacoes: '' },
    { id: 5, data: '2026-03-12', descricao: 'Consultoria', categoria: 'Freelance', valor: 2000, recorrente: false, observacoes: '' },
    { id: 6, data: '2026-03-20', descricao: 'Rendimento CDB', categoria: 'Investimentos', valor: 410, recorrente: false, observacoes: '' },
    { id: 7, data: '2026-04-05', descricao: 'Salário', categoria: 'Salário', valor: 8500, recorrente: true, observacoes: '' },
    { id: 8, data: '2026-04-18', descricao: 'Aluguel imóvel', categoria: 'Outros', valor: 1500, recorrente: true, observacoes: 'Apartamento' },
    { id: 9, data: '2026-04-22', descricao: 'Freelance Design', categoria: 'Freelance', valor: 800, recorrente: false, observacoes: '' },
    { id: 10, data: '2026-04-28', descricao: 'Dividendos', categoria: 'Investimentos', valor: 380, recorrente: false, observacoes: 'PETR4' },
    { id: 11, data: '2026-05-05', descricao: 'Salário', categoria: 'Salário', valor: 8500, recorrente: true, observacoes: '' },
    { id: 12, data: '2026-05-07', descricao: 'Bônus trimestral', categoria: 'Salário', valor: 2500, recorrente: false, observacoes: '' },
    { id: 13, data: '2026-05-09', descricao: 'Rendimento Tesouro', categoria: 'Investimentos', valor: 290, recorrente: false, observacoes: '' },
  ],
  despesas: [
    { id: 1, data: '2026-02-05', descricao: 'Aluguel', categoria: 'Moradia', tipo: 'Fixa', valor: 2200, pagamento: 'Débito', status: 'Pago', observacoes: '' },
    { id: 2, data: '2026-02-07', descricao: 'Supermercado', categoria: 'Alimentação', tipo: 'Variável', valor: 680, pagamento: 'Crédito', status: 'Pago', observacoes: '' },
    { id: 3, data: '2026-02-10', descricao: 'Combustível', categoria: 'Transporte', tipo: 'Variável', valor: 280, pagamento: 'Débito', status: 'Pago', observacoes: '' },
    { id: 4, data: '2026-02-12', descricao: 'Netflix/Streaming', categoria: 'Lazer', tipo: 'Fixa', valor: 85, pagamento: 'Crédito', status: 'Pago', observacoes: '' },
    { id: 5, data: '2026-02-15', descricao: 'Plano de Saúde', categoria: 'Saúde', tipo: 'Fixa', valor: 450, pagamento: 'Débito', status: 'Pago', observacoes: '' },
    { id: 6, data: '2026-02-18', descricao: 'Curso Online', categoria: 'Educação', tipo: 'Fixa', valor: 199, pagamento: 'Crédito', status: 'Pago', observacoes: '' },
    { id: 7, data: '2026-02-20', descricao: 'iPhone 15 Pro (1/12)', categoria: 'Outros', tipo: 'Parcelada', valor: 583, pagamento: 'Crédito', status: 'Pago', observacoes: 'Parcela 1/12' },
    { id: 8, data: '2026-02-22', descricao: 'Restaurante', categoria: 'Alimentação', tipo: 'Variável', valor: 220, pagamento: 'Crédito', status: 'Pago', observacoes: '' },
    { id: 9, data: '2026-03-05', descricao: 'Aluguel', categoria: 'Moradia', tipo: 'Fixa', valor: 2200, pagamento: 'Débito', status: 'Pago', observacoes: '' },
    { id: 10, data: '2026-03-08', descricao: 'Supermercado', categoria: 'Alimentação', tipo: 'Variável', valor: 720, pagamento: 'Crédito', status: 'Pago', observacoes: '' },
    { id: 11, data: '2026-03-10', descricao: 'Combustível', categoria: 'Transporte', tipo: 'Variável', valor: 310, pagamento: 'Débito', status: 'Pago', observacoes: '' },
    { id: 12, data: '2026-03-12', descricao: 'Netflix/Streaming', categoria: 'Lazer', tipo: 'Fixa', valor: 85, pagamento: 'Crédito', status: 'Pago', observacoes: '' },
    { id: 13, data: '2026-03-15', descricao: 'Plano de Saúde', categoria: 'Saúde', tipo: 'Fixa', valor: 450, pagamento: 'Débito', status: 'Pago', observacoes: '' },
    { id: 14, data: '2026-03-18', descricao: 'Curso Online', categoria: 'Educação', tipo: 'Fixa', valor: 199, pagamento: 'Crédito', status: 'Pago', observacoes: '' },
    { id: 15, data: '2026-03-20', descricao: 'iPhone 15 Pro (2/12)', categoria: 'Outros', tipo: 'Parcelada', valor: 583, pagamento: 'Crédito', status: 'Pago', observacoes: 'Parcela 2/12' },
    { id: 16, data: '2026-03-25', descricao: 'Academia', categoria: 'Saúde', tipo: 'Fixa', valor: 130, pagamento: 'Débito', status: 'Pago', observacoes: '' },
    { id: 17, data: '2026-03-28', descricao: 'Uber/Taxi', categoria: 'Transporte', tipo: 'Variável', valor: 95, pagamento: 'Crédito', status: 'Pago', observacoes: '' },
    { id: 18, data: '2026-04-05', descricao: 'Aluguel', categoria: 'Moradia', tipo: 'Fixa', valor: 2200, pagamento: 'Débito', status: 'Pago', observacoes: '' },
    { id: 19, data: '2026-04-07', descricao: 'Supermercado', categoria: 'Alimentação', tipo: 'Variável', valor: 650, pagamento: 'Crédito', status: 'Pago', observacoes: '' },
    { id: 20, data: '2026-04-10', descricao: 'Combustível', categoria: 'Transporte', tipo: 'Variável', valor: 295, pagamento: 'Débito', status: 'Pago', observacoes: '' },
    { id: 21, data: '2026-04-12', descricao: 'Netflix/Streaming', categoria: 'Lazer', tipo: 'Fixa', valor: 85, pagamento: 'Crédito', status: 'Pago', observacoes: '' },
    { id: 22, data: '2026-04-15', descricao: 'Plano de Saúde', categoria: 'Saúde', tipo: 'Fixa', valor: 450, pagamento: 'Débito', status: 'Pago', observacoes: '' },
    { id: 23, data: '2026-04-18', descricao: 'Notebook Dell (3/10)', categoria: 'Outros', tipo: 'Parcelada', valor: 420, pagamento: 'Crédito', status: 'Pago', observacoes: 'Parcela 3/10' },
    { id: 24, data: '2026-04-20', descricao: 'iPhone 15 Pro (3/12)', categoria: 'Outros', tipo: 'Parcelada', valor: 583, pagamento: 'Crédito', status: 'Pago', observacoes: 'Parcela 3/12' },
    { id: 25, data: '2026-04-22', descricao: 'Academia', categoria: 'Saúde', tipo: 'Fixa', valor: 130, pagamento: 'Débito', status: 'Pago', observacoes: '' },
    { id: 26, data: '2026-04-25', descricao: 'Restaurante', categoria: 'Alimentação', tipo: 'Variável', valor: 180, pagamento: 'Crédito', status: 'Pago', observacoes: '' },
    { id: 27, data: '2026-05-05', descricao: 'Aluguel', categoria: 'Moradia', tipo: 'Fixa', valor: 2200, pagamento: 'Débito', status: 'Pago', observacoes: '' },
    { id: 28, data: '2026-05-07', descricao: 'Supermercado', categoria: 'Alimentação', tipo: 'Variável', valor: 590, pagamento: 'Crédito', status: 'Pendente', observacoes: '' },
    { id: 29, data: '2026-05-08', descricao: 'Netflix/Streaming', categoria: 'Lazer', tipo: 'Fixa', valor: 85, pagamento: 'Crédito', status: 'Pendente', observacoes: '' },
    { id: 30, data: '2026-05-09', descricao: 'iPhone 15 Pro (4/12)', categoria: 'Outros', tipo: 'Parcelada', valor: 583, pagamento: 'Crédito', status: 'Pendente', observacoes: 'Parcela 4/12' },
    { id: 31, data: '2026-05-09', descricao: 'Notebook Dell (4/10)', categoria: 'Outros', tipo: 'Parcelada', valor: 420, pagamento: 'Crédito', status: 'Pendente', observacoes: 'Parcela 4/10' },
    { id: 32, data: '2026-05-15', descricao: 'Plano de Saúde', categoria: 'Saúde', tipo: 'Fixa', valor: 450, pagamento: 'Débito', status: 'Pendente', observacoes: '' },
    { id: 33, data: '2026-05-15', descricao: 'Academia', categoria: 'Saúde', tipo: 'Fixa', valor: 130, pagamento: 'Débito', status: 'Pendente', observacoes: '' },
  ],
  parcelamentos: [
    {
      id: 1, nome: 'iPhone 15 Pro', valorTotal: 6999, parcelas: 12, valorParcela: 583.25,
      dataPrimeiraParcela: '2026-02-20', parcelasPagas: 3, formaPagamento: 'Crédito'
    },
    {
      id: 2, nome: 'Notebook Dell XPS', valorTotal: 4200, parcelas: 10, valorParcela: 420,
      dataPrimeiraParcela: '2026-02-18', parcelasPagas: 3, formaPagamento: 'Crédito'
    },
    {
      id: 3, nome: 'Smart TV 65"', valorTotal: 3600, parcelas: 6, valorParcela: 600,
      dataPrimeiraParcela: '2026-04-10', parcelasPagas: 1, formaPagamento: 'Crédito'
    },
  ],
  patrimonio: [
    { id: 1, tipo: 'Conta Corrente', instituicao: 'Nubank', descricao: 'Conta principal', valorAtual: 8200, variacaoMensal: 1200 },
    { id: 2, tipo: 'Poupança', instituicao: 'Itaú', descricao: 'Reserva emergência', valorAtual: 24000, variacaoMensal: 180 },
    { id: 3, tipo: 'Investimentos', instituicao: 'XP Investimentos', descricao: 'CDB/Tesouro/Ações', valorAtual: 87500, variacaoMensal: 3200 },
    { id: 4, tipo: 'Imóvel', instituicao: 'Próprio', descricao: 'Apartamento 2 quartos', valorAtual: 420000, variacaoMensal: 2100 },
    { id: 5, tipo: 'Veículo', instituicao: 'Próprio', descricao: 'Honda Civic 2023', valorAtual: 98000, variacaoMensal: -800 },
    { id: 6, tipo: 'Investimentos', instituicao: 'Toro', descricao: 'Ações B3', valorAtual: 15600, variacaoMensal: 420 },
  ],
  dividasList: [
    {
      id: 1, tipo: 'Financiamento', credor: 'Banco do Brasil', valorOriginal: 280000,
      saldoDevedor: 198000, taxaJuros: 8.5, parcelaMensal: 2100, dataQuitacao: '2035-06-01', descricao: 'Financiamento imóvel'
    },
    {
      id: 2, tipo: 'Financiamento', credor: 'Santander', valorOriginal: 75000,
      saldoDevedor: 42000, taxaJuros: 12.99, parcelaMensal: 1450, dataQuitacao: '2028-03-01', descricao: 'Financiamento veículo'
    },
    {
      id: 3, tipo: 'Cartão', credor: 'Nubank', valorOriginal: 3800,
      saldoDevedor: 3800, taxaJuros: 2.99, parcelaMensal: 583, dataQuitacao: '2027-02-01', descricao: 'Parcelamentos cartão'
    },
  ],
  metas: [
    { id: 1, nome: 'Viagem Europa', valorAlvo: 25000, prazo: '2027-07-01', acumulado: 8500, descricao: 'Férias na Europa com família' },
    { id: 2, nome: 'Fundo Emergência 6 meses', valorAlvo: 50000, prazo: '2026-12-01', acumulado: 32200, descricao: '6 meses de despesas' },
    { id: 3, nome: 'Aposentadoria Antecipada', valorAlvo: 2000000, prazo: '2050-01-01', acumulado: 103100, descricao: 'FIRE - 50 anos' },
    { id: 4, nome: 'Troca do Carro', valorAlvo: 120000, prazo: '2028-01-01', acumulado: 15000, descricao: 'SUV elétrico' },
  ],
  tarefas: [
    { id: 1, titulo: 'Revisar declaração de IR', categoria: 'Financeiro', prioridade: 'Alta', status: 'Pendente', tempoEstimado: 120, tempoReal: 0, data: '2026-05-09' },
    { id: 2, titulo: 'Reunião com cliente', categoria: 'Trabalho', prioridade: 'Alta', status: 'Concluída', tempoEstimado: 60, tempoReal: 75, data: '2026-05-09' },
    { id: 3, titulo: 'Academia - treino A', categoria: 'Saúde', prioridade: 'Média', status: 'Concluída', tempoEstimado: 90, tempoReal: 85, data: '2026-05-09' },
    { id: 4, titulo: 'Estudar React avançado', categoria: 'Estudos', prioridade: 'Média', status: 'Em andamento', tempoEstimado: 60, tempoReal: 30, data: '2026-05-09' },
    { id: 5, titulo: 'Pagar contas pendentes', categoria: 'Financeiro', prioridade: 'Alta', status: 'Pendente', tempoEstimado: 20, tempoReal: 0, data: '2026-05-09' },
    { id: 6, titulo: 'Ler livro Pai Rico', categoria: 'Estudos', prioridade: 'Baixa', status: 'Concluída', tempoEstimado: 45, tempoReal: 50, data: '2026-05-08' },
    { id: 7, titulo: 'Ligar para seguradora', categoria: 'Pessoal', prioridade: 'Média', status: 'Pendente', tempoEstimado: 30, tempoReal: 0, data: '2026-05-08' },
    { id: 8, titulo: 'Code review projeto X', categoria: 'Trabalho', prioridade: 'Alta', status: 'Concluída', tempoEstimado: 90, tempoReal: 110, data: '2026-05-08' },
  ],
  habitos: [
    { id: 1, nome: 'Exercício físico', streak: 14, meta: 30, completadoHoje: true },
    { id: 2, nome: 'Meditação', streak: 7, meta: 21, completadoHoje: true },
    { id: 3, nome: 'Leitura 30min', streak: 5, meta: 30, completadoHoje: false },
    { id: 4, nome: 'Controle financeiro', streak: 21, meta: 30, completadoHoje: true },
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
