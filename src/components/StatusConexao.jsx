import { useState, useEffect } from 'react';
import { account } from '../lib/appwrite';

export default function StatusConexao() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const verificar = async () => {
      try {
        await account.get();
        setOnline(true);
      } catch {
        setOnline(false);
      }
    };
    
    verificar();
    const intervalo = setInterval(verificar, 30000); // verificar a cada 30s
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div 
      className={`fixed bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-md z-50 transition-colors ${online ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}
      style={{ position: 'fixed', bottom: 16, right: 16 }}
    >
      <div className={`w-2 h-2 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} style={{ width: 8, height: 8, borderRadius: '50%' }} />
      {online ? 'Dados sincronizados' : 'Sem conexão com servidor'}
    </div>
  );
}
