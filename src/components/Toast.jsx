import { useState, useEffect } from 'react';

export const mostrarToast = (mensagem, tipo = 'sucesso') => {
  const event = new CustomEvent('mostrar-toast', { detail: { mensagem, tipo } });
  window.dispatchEvent(event);
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const { mensagem, tipo } = e.detail;
      const id = Date.now();
      setToasts(prev => [...prev, { id, mensagem, tipo }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };

    window.addEventListener('mostrar-toast', handleToast);
    return () => window.removeEventListener('mostrar-toast', handleToast);
  }, []);

  const cores = {
    sucesso: 'bg-green-500 text-white',
    erro: 'bg-red-500 text-white',
    aviso: 'bg-yellow-500 text-white'
  };

  const icones = {
    sucesso: '✅',
    erro: '❌',
    aviso: '⚠️'
  };

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded shadow-lg font-medium animate-fade ${cores[t.tipo]}`}>
          <span>{icones[t.tipo]}</span>
          <span>{t.mensagem}</span>
        </div>
      ))}
    </div>
  );
}
