import {
  LayoutDashboard, TrendingUp, TrendingDown, CreditCard, Landmark,
  Target, CheckSquare, Shield, Upload, CheckCircle2
} from 'lucide-react';

const secoes = [
  {
    icon: LayoutDashboard,
    cor: 'var(--accent-blue)',
    titulo: 'Dashboard',
    texto: 'Sua visão geral. No topo, alterne entre Visão Geral, Anual, Mensal ou Período (datas personalizadas). Acompanhe receitas, despesas, saldo, evolução financeira, patrimônio e próximos parcelamentos em um só lugar.'
  },
  {
    icon: TrendingUp,
    cor: 'var(--accent-green)',
    titulo: 'Receitas',
    texto: 'Cadastre suas entradas. Marque uma receita como recorrente para gerá-la automaticamente nos próximos meses. Use os checkboxes para selecionar várias e editar categoria ou excluir em massa.'
  },
  {
    icon: TrendingDown,
    cor: 'var(--accent-red)',
    titulo: 'Despesas',
    texto: 'Registre seus gastos como Fixa, Variável ou Parcelada. Despesas fixas podem repetir todos os meses do ano automaticamente. Selecione várias despesas para alterar categoria, cartão, forma de pagamento ou excluir de uma vez.'
  },
  {
    icon: Upload,
    cor: 'var(--accent-purple)',
    titulo: 'Importar Planilha',
    texto: 'Nas abas Despesas e Parcelamentos, use "Importar Planilha". Baixe o modelo, preencha seus dados (datas no formato DD/MM/AAAA) e importe tudo de uma vez. A coluna Cartão deve ter o nome exato do cartão cadastrado.'
  },
  {
    icon: CreditCard,
    cor: 'var(--accent-yellow)',
    titulo: 'Cartões',
    texto: 'Cadastre seus cartões com limite, dia de fechamento e vencimento. Ao lançar uma despesa no crédito, escolha o cartão para acompanhar quanto já usou do limite em cada um.'
  },
  {
    icon: CreditCard,
    cor: 'var(--accent-purple)',
    titulo: 'Parcelamentos',
    texto: 'Ao cadastrar um parcelamento, informe o valor total OU o valor da parcela — o sistema calcula o restante. As parcelas viram despesas automáticas mês a mês. Marque cada parcela como paga com um clique.'
  },
  {
    icon: Landmark,
    cor: 'var(--accent-blue)',
    titulo: 'Patrimônio',
    texto: 'Registre seus bens e investimentos (contas, aplicações, imóveis, veículos). Acompanhe a alocação e a evolução do seu patrimônio ao longo do tempo.'
  },
  {
    icon: Shield,
    cor: 'var(--accent-red)',
    titulo: 'Dívidas',
    texto: 'Controle empréstimos e financiamentos com credor, saldo devedor, juros e parcela mensal. Tenha clareza de quanto ainda falta quitar.'
  },
  {
    icon: Target,
    cor: 'var(--accent-green)',
    titulo: 'Metas',
    texto: 'Defina objetivos financeiros (viagem, reserva, compra) com valor-alvo e prazo. Acompanhe visualmente o quanto já acumulou de cada meta.'
  },
  {
    icon: CheckSquare,
    cor: 'var(--accent-purple)',
    titulo: 'Produtividade',
    texto: 'Gerencie tarefas com prioridade e status. Os campos de tempo são opcionais. Registre também seu aproveitamento mensal (%) para acompanhar sua evolução no gráfico.'
  },
];

const dicas = [
  'Seus dados são salvos automaticamente na nuvem e ficam disponíveis em qualquer dispositivo ao entrar na sua conta.',
  'Use o filtro de Período no Dashboard para analisar intervalos específicos de datas.',
  'Ao importar planilhas, sempre baixe o modelo primeiro para garantir o formato correto das colunas.',
  'O nome do cartão na planilha precisa ser idêntico ao cadastrado na aba Cartões.',
  'Tem uma sugestão ou encontrou um problema? Use a aba Feedback para nos avisar.'
];

export default function Instrucoes() {
  return (
    <div className="animate-fade">
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Como Usar o Sistema</h1>
          <p className="text-secondary">Um guia rápido para aproveitar todos os recursos</p>
        </div>
      </div>

      {/* Boas-vindas */}
      <div className="card mb-6" style={{ borderLeft: '4px solid var(--accent-green)' }}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
          👋 Bem-vindo ao seu sistema de finanças e produtividade! Aqui você organiza receitas, despesas,
          cartões, parcelamentos, patrimônio, metas e muito mais. Veja abaixo o que cada área faz.
        </p>
      </div>

      {/* Seções */}
      <div className="grid-2 mb-6" style={{ gap: 16 }}>
        {secoes.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                background: `${s.cor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon size={20} color={s.cor} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{s.titulo}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.texto}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dicas rápidas */}
      <div className="card">
        <div className="section-title mb-4">💡 Dicas Rápidas</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {dicas.map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}