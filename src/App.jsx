import { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Receitas from './components/Receitas';
import Despesas from './components/Despesas';
import Parcelamentos from './components/Parcelamentos';
import Cartoes from './components/Cartoes';
import Patrimonio from './components/Patrimonio';
import Dividas from './components/Dividas';
import Metas from './components/Metas';
import Produtividade from './components/Produtividade';
import Feedback from './components/Feedback';
import ToastContainer from './components/Toast';
import StatusConexao from './components/StatusConexao';
import { initVerificarPersistencia } from './utils/verificarPersistencia';

import { calcFinancialScore, getAvailableMonths } from './utils/helpers';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/Auth/LoginPage';
import { appwriteService } from './services/appwriteService';
import { COLLECTIONS } from './lib/appwrite';

/*
  REGRAS DE PERSISTÊNCIA (Appwrite First)
  1. O estado local (useState) é apenas um reflexo do Appwrite.
  2. Toda operação de salvar/editar/excluir deve chamar o Appwrite PRIMEIRO.
  3. Não utilizar localStorage para armazenar dados críticos (apenas configurações visuais).
  4. O ID dos documentos deve ser sempre o ID gerado pelo Appwrite ($id).
*/

function AppContent() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Carregando sessão...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  return <FinanceApp user={user} logout={logout} />;
}

function FinanceApp({ user, logout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('financepro_theme') || 'dark');
  const [viewMode, setViewMode] = useState('geral');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [appLoading, setAppLoading] = useState(true);

  // Estados sempre começam vazios! (Sem sampleData)
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [cartoes, setCartoes] = useState([]);
  const [receitas, setReceitas] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [parcelamentos, setParcelamentos] = useState([]);
  const [patrimonio, setPatrimonio] = useState([]);
  const [dividasList, setDividasList] = useState([]);
  const [metas, setMetas] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [habitos, setHabitos] = useState([]);
  const [aproveitamentoMensal, setAproveitamentoMensal] = useState([]);
  
  // Arrays vazios para evitar quebra do Dashboard antes da sua atualização
  const patrimonioHistorico = [];
  const receitasDespesasMensais = [];

  // Iniciar checklist global
  useEffect(() => {
    initVerificarPersistencia(user.$id);
  }, [user.$id]);

  useEffect(() => {
    const carregarDados = async () => {
      setAppLoading(true);
      try {
        // Carregar receitas, despesas, parcelamentos e categorias do Appwrite
        const [rec, desp, parc, cat] = await Promise.all([
          appwriteService.listar(COLLECTIONS.RECEITAS, user.$id),
          appwriteService.listar(COLLECTIONS.DESPESAS, user.$id),
          appwriteService.listar(COLLECTIONS.PARCELAMENTOS, user.$id),
          appwriteService.listar(COLLECTIONS.CATEGORIAS, user.$id)
        ]);

        setReceitas(rec);
        setDespesas(desp);
        setParcelamentos(parc);

        // Mapear categorias customizadas
        const inc = [];
        const exp = [];
        cat.forEach(c => {
          if (c.tipo === 'receita') inc.push({ id: c.$id, name: c.nome, color: c.cor });
          else exp.push({ id: c.$id, name: c.nome, color: c.cor });
        });

        // Valores default caso o usuário não tenha categorias
        if (inc.length === 0) inc.push({ id: 'default1', name: 'Salário', color: '#10B981' });
        if (exp.length === 0) exp.push({ id: 'default2', name: 'Alimentação', color: '#EF4444' });

        setCategories({ income: inc, expense: exp });
      } catch (error) {
        console.error("Erro ao carregar dados centrais do Appwrite:", error);
      } finally {
        setAppLoading(false);
      }
    };

    carregarDados();
  }, [user.$id]);

  // Persistir o tema visual
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('financepro_theme', theme);
  }, [theme]);

  // Available months
  const availableMonths = useMemo(() => getAvailableMonths(receitas, despesas), [receitas, despesas]);

  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  // Financial score
  const score = useMemo(() =>
    calcFinancialScore(receitas, despesas, patrimonio, dividasList, metas),
    [receitas, despesas, patrimonio, dividasList, metas]
  );

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }, []);

  const data = useMemo(() => ({
    categories, cartoes, receitas, despesas, parcelamentos, patrimonio, dividasList, metas, tarefas, habitos, patrimonioHistorico, aproveitamentoMensal, receitasDespesasMensais
  }), [categories, cartoes, receitas, despesas, parcelamentos, patrimonio, dividasList, metas, tarefas, habitos, patrimonioHistorico, aproveitamentoMensal, receitasDespesasMensais]);

  if (appLoading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Sincronizando com Appwrite...</div>;
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard data={data} viewMode={viewMode} setViewMode={setViewMode} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} availableMonths={availableMonths} />;
      case 'receitas':
        return <Receitas receitas={receitas} setReceitas={setReceitas} categories={categories} setCategories={setCategories} user={user} />;
      case 'despesas':
        return <Despesas despesas={despesas} setDespesas={setDespesas} categories={categories} setCategories={setCategories} cartoes={cartoes} user={user} />;
      case 'cartoes':
        return <Cartoes cartoes={cartoes} setCartoes={setCartoes} despesas={despesas} user={user} />;
      case 'parcelamentos':
        return <Parcelamentos parcelamentos={parcelamentos} setParcelamentos={setParcelamentos} despesas={despesas} setDespesas={setDespesas} cartoes={cartoes} categories={categories} user={user} />;
      case 'patrimonio':
        return <Patrimonio patrimonio={patrimonio} setPatrimonio={setPatrimonio} user={user} />;
      case 'dividas':
        return <Dividas dividasList={dividasList} setDividasList={setDividasList} user={user} />;
      case 'metas':
        return <Metas metas={metas} setMetas={setMetas} receitas={receitas} despesas={despesas} user={user} />;
      case 'produtividade':
        return <Produtividade tarefas={tarefas} setTarefas={setTarefas} habitos={habitos} setHabitos={setHabitos} aproveitamentoMensal={aproveitamentoMensal} setAproveitamentoMensal={setAproveitamentoMensal} user={user} />;
      case 'feedback':
        return <Feedback user={user} />;
      default:
        return null;
    }
  };

  return (
    <div className="app" data-theme={theme}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        score={score}
      />
      <main className="main-content">
        {renderTab()}

        <div style={{ marginTop: 48, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            ☁️ Sincronizado na Nuvem (Appwrite) · Logado como {user?.email}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { if (window.confirm('Deseja sair?')) logout(); }} style={{ color: 'var(--accent-red)' }}>
            Sair da Conta
          </button>
        </div>
      </main>
      
      <ToastContainer />
      <StatusConexao />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
