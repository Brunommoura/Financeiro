import { useState } from 'react';
import {
  LayoutDashboard, TrendingUp, TrendingDown, CreditCard, Landmark, Target,
  CheckSquare, Settings, Moon, Sun, Menu, X, DollarSign, PiggyBank,
  BarChart3, Wallet, Shield, Award
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Principal' },
  { id: 'receitas', label: 'Receitas', icon: TrendingUp, section: 'Financeiro' },
  { id: 'despesas', label: 'Despesas', icon: TrendingDown, section: 'Financeiro' },
  { id: 'parcelamentos', label: 'Parcelamentos', icon: CreditCard, section: 'Financeiro' },
  { id: 'patrimonio', label: 'Patrimônio', icon: Landmark, section: 'Patrimônio' },
  { id: 'dividas', label: 'Dívidas', icon: Shield, section: 'Patrimônio' },
  { id: 'metas', label: 'Metas', icon: Target, section: 'Planejamento' },
  { id: 'produtividade', label: 'Produtividade', icon: CheckSquare, section: 'Planejamento' },
];

export default function Sidebar({ activeTab, setActiveTab, theme, toggleTheme, score }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const sections = [...new Set(navItems.map(i => i.section))];

  const scoreColor = score >= 800 ? '#10b981' : score >= 600 ? '#3b82f6' : score >= 400 ? '#f59e0b' : '#ef4444';

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{ display: 'none', position: 'fixed', top: 16, left: 16, zIndex: 300 }}
        className="btn btn-ghost btn-icon mobile-toggle"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className="sidebar" style={{ display: mobileOpen ? 'block' : undefined }}>
        {/* Logo */}
        <div className="nav-logo">
          <div className="nav-logo-title">💰 FinancePro</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Gestão Financeira</div>
        </div>

        {/* Score rápido */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Saúde Financeira</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              border: `3px solid ${scoreColor}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: scoreColor,
              flexShrink: 0
            }}>{score}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: scoreColor }}>
                {score >= 800 ? 'Excelente' : score >= 600 ? 'Bom' : score >= 400 ? 'Regular' : 'Atenção'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Score / 1000</div>
            </div>
          </div>
          <div className="progress-bar" style={{ marginTop: 8, height: 5 }}>
            <div className="progress-fill" style={{ width: `${(score / 1000) * 100}%`, background: scoreColor }} />
          </div>
        </div>

        {/* Nav */}
        {sections.map(section => {
          const items = navItems.filter(i => i.section === section);
          return (
            <div key={section}>
              <div className="nav-section">{section}</div>
              {items.map(item => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
                  >
                    <Icon size={16} />
                    {item.label}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Theme toggle */}
        <div style={{ padding: '12px 16px', marginTop: 'auto', borderTop: '1px solid var(--border)', position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--bg-secondary)' }}>
          <button onClick={toggleTheme} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </button>
        </div>
      </aside>
    </>
  );
}
