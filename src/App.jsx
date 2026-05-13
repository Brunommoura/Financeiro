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
import { sampleData } from './data/sampleData';
import { calcFinancialScore, getAvailableMonths } from './utils/helpers';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/Auth/LoginPage';
import { appwriteService } from './services/appwriteService';
import { COLLECTIONS } from './lib/appwrite';

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

  // States
  const [categories, setCategories] = useState(sampleData.categories);
  const [cartoes, setCartoes] = useState(sampleData.cartoes);
  const [receitas, setReceitas] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [parcelamentos, setParcelamentos] = useState([]);
  const [patrimonio, setPatrimonio] = useState(sampleData.patrimonio);
  const [dividasList, setDividasList] = useState(sampleData.dividasList);
  const [metas, setMetas] = useState(sampleData.metas);
  const [tarefas, setTarefas] = useState(sampleData.tarefas);
  const [habitos, setHabitos] = useState(sampleData.habitos);
  const [patrimonioHistorico] = useState(sampleData.patrimonioHistorico);
  const [aproveitamentoMensal, setAproveitamentoMensal] = useState(sampleData.aproveitamentoMensal);
  const [receitasDespesasMensais] = useState(sampleData.receitasDespesasMensais);

  const STORAGE_KEY = `financepro_local_${user.$id}`;

  useEffect(() => {
    const carregarDados = async () => {
      setAppLoading(true);
      try {
        // Carregar dados locais (temporário para coleções não migradas 100%)
        const localData = localStorage.getItem(STORAGE_KEY);
        if (localData) {
          const parsed = JSON.parse(localData);
          if (parsed.categories) setCategories(parsed.categories);
          if (parsed.cartoes) setCartoes(parsed.cartoes);
          if (parsed.patrimonio) setPatrimonio(parsed.patrimonio);
          if (parsed.dividasList) setDividasList(parsed.dividasList);
          if (parsed.metas) setMetas(parsed.metas);
          if (parsed.tarefas) setTarefas(parsed.tarefas);
          if (parsed.habitos) setHabitos(parsed.habitos);
        }

        // Carregar do Appwrite
        const [rec, desp, parc] = await Promise.all([
          appwriteService.listar(COLLECTIONS.RECEITAS, user.$id),
          appwriteService.listar(COLLECTIONS.DESPESAS, user.$id),
          appwriteService.listar(COLLECTIONS.PARCELAMENTOS, user.$id)
        ]);

        setReceitas(rec);
        setDespesas(desp);
        setParcelamentos(parc);
      } catch (error) {
        console.error("Erro ao carregar dados do Appwrite:", error);
      } finally {
        setAppLoading(false);
      }
    };

    carregarDados();
  }, [user.$id]);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('financepro_theme', theme);
  }, [theme]);

  // Persist non-Appwrite data locally
  useEffect(() => {
    if (!appLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        categories, cartoes, patrimonio, dividasList, metas, tarefas, habitos, patrimonioHistorico, aproveitamentoMensal, receitasDespesasMensais
      }));
    }
  }, [categories, cartoes, patrimonio, dividasList, metas, tarefas, habitos, patrimonioHistorico, aproveitamentoMensal, receitasDespesasMensais, appLoading, STORAGE_KEY]);

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
        return <Cartoes cartoes={cartoes} setCartoes={setCartoes} despesas={despesas} />;
      case 'parcelamentos':
        return <Parcelamentos parcelamentos={parcelamentos} setParcelamentos={setParcelamentos} despesas={despesas} setDespesas={setDespesas} cartoes={cartoes} categories={categories} user={user} />;
      case 'patrimonio':
        return <Patrimonio patrimonio={patrimonio} setPatrimonio={setPatrimonio} />;
      case 'dividas':
        return <Dividas dividasList={dividasList} setDividasList={setDividasList} />;
      case 'metas':
        return <Metas metas={metas} setMetas={setMetas} receitas={receitas} despesas={despesas} />;
      case 'produtividade':
        return <Produtividade tarefas={tarefas} setTarefas={setTarefas} habitos={habitos} setHabitos={setHabitos} aproveitamentoMensal={aproveitamentoMensal} setAproveitamentoMensal={setAproveitamentoMensal} />;
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
