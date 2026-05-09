import { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Receitas from './components/Receitas';
import Despesas from './components/Despesas';
import Parcelamentos from './components/Parcelamentos';
import Patrimonio from './components/Patrimonio';
import Dividas from './components/Dividas';
import Metas from './components/Metas';
import Produtividade from './components/Produtividade';
import { sampleData } from './data/sampleData';
import { calcFinancialScore, getAvailableMonths } from './utils/helpers';



const STORAGE_KEY = 'financepro_data_v1';

const loadData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { }
  return sampleData;
};

const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('financepro_theme') || 'dark');
  const [viewMode, setViewMode] = useState('geral');
  const [selectedMonth, setSelectedMonth] = useState('');

  const [receitas, setReceitas] = useState(() => loadData().receitas);
  const [despesas, setDespesas] = useState(() => loadData().despesas);
  const [parcelamentos, setParcelamentos] = useState(() => loadData().parcelamentos);
  const [patrimonio, setPatrimonio] = useState(() => loadData().patrimonio);
  const [dividasList, setDividasList] = useState(() => loadData().dividasList);
  const [metas, setMetas] = useState(() => loadData().metas);
  const [tarefas, setTarefas] = useState(() => loadData().tarefas);
  const [habitos, setHabitos] = useState(() => loadData().habitos);
  const [patrimonioHistorico] = useState(() => loadData().patrimonioHistorico);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('financepro_theme', theme);
  }, [theme]);

  // Persist data on every change
  useEffect(() => {
    saveData({ receitas, despesas, parcelamentos, patrimonio, dividasList, metas, tarefas, habitos, patrimonioHistorico });
  }, [receitas, despesas, parcelamentos, patrimonio, dividasList, metas, tarefas, habitos, patrimonioHistorico]);

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
    receitas, despesas, parcelamentos, patrimonio, dividasList, metas, tarefas, habitos, patrimonioHistorico
  }), [receitas, despesas, parcelamentos, patrimonio, dividasList, metas, tarefas, habitos, patrimonioHistorico]);

  // Reset to sample data
  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja resetar todos os dados para os valores de exemplo? Esta ação não pode ser desfeita.')) {
      setReceitas(sampleData.receitas);
      setDespesas(sampleData.despesas);
      setParcelamentos(sampleData.parcelamentos);
      setPatrimonio(sampleData.patrimonio);
      setDividasList(sampleData.dividasList);
      setMetas(sampleData.metas);
      setTarefas(sampleData.tarefas);
      setHabitos(sampleData.habitos);
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard data={data} viewMode={viewMode} setViewMode={setViewMode} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} availableMonths={availableMonths} />;
      case 'receitas':
        return <Receitas receitas={receitas} setReceitas={setReceitas} />;
      case 'despesas':
        return <Despesas despesas={despesas} setDespesas={setDespesas} />;
      case 'parcelamentos':
        return <Parcelamentos parcelamentos={parcelamentos} setParcelamentos={setParcelamentos} />;
      case 'patrimonio':
        return <Patrimonio patrimonio={patrimonio} setPatrimonio={setPatrimonio} />;
      case 'dividas':
        return <Dividas dividasList={dividasList} setDividasList={setDividasList} />;
      case 'metas':
        return <Metas metas={metas} setMetas={setMetas} receitas={receitas} despesas={despesas} />;
      case 'produtividade':
        return <Produtividade tarefas={tarefas} setTarefas={setTarefas} habitos={habitos} setHabitos={setHabitos} />;
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

        {/* Footer com botão reset */}
        <div style={{ marginTop: 48, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            💾 Dados salvos automaticamente · FinancePro v1.0
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleReset} style={{ color: 'var(--text-muted)' }}>
            🔄 Resetar dados
          </button>
        </div>
      </main>
    </div>
  );
}
