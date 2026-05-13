import { useState } from 'react';
import { Send, Bug, Lightbulb, Heart, HelpCircle, MessageSquare, Loader2 } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { appwriteService } from '../services/appwriteService';
import { COLLECTIONS } from '../lib/appwrite';

const TIPOS = [
  { id: 'bug', label: 'Bug/Erro', icon: Bug, color: 'var(--accent-red)' },
  { id: 'sugestao', label: 'Sugestão', icon: Lightbulb, color: 'var(--accent-yellow)' },
  { id: 'elogio', label: 'Elogio', icon: Heart, color: 'var(--accent-green)' },
  { id: 'duvida', label: 'Dúvida', icon: HelpCircle, color: 'var(--accent-blue)' },
  { id: 'outro', label: 'Outro', icon: MessageSquare, color: 'var(--text-secondary)' }
];

export default function Feedback({ user }) {
  const [tipo, setTipo] = useState('sugestao');
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assunto || !mensagem) return;
    
    setLoading(true);
    try {
      // 1. Salvar no Appwrite
      const feedbackDoc = {
        userEmail: email,
        tipo,
        assunto,
        mensagem,
        status: 'novo',
        dataEnvio: new Date().toISOString()
      };
      
      await appwriteService.criar(COLLECTIONS.FEEDBACKS, user.$id, feedbackDoc);

      // 2. Enviar via EmailJS (se as variáveis estiverem configuradas)
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
      
      if (serviceId && templateId && publicKey) {
        await emailjs.send(
          serviceId,
          templateId,
          {
            to_email: 'brunomedm@outlook.com',
            from_name: user?.name || email || 'Usuário',
            from_email: email,
            tipo: TIPOS.find(t => t.id === tipo)?.label,
            assunto,
            mensagem,
            data: new Date().toLocaleString('pt-BR')
          },
          publicKey
        );
      } else {
        console.warn("Variáveis do EmailJS não configuradas. Feedback salvo apenas no Appwrite.");
      }

      setSuccess(true);
      setAssunto('');
      setMensagem('');
      // Resetar form após 3 segundos
      setTimeout(() => setSuccess(false), 4000);
    } catch (error) {
      console.error("Erro ao enviar feedback:", error);
      alert("❌ Erro ao enviar. Tente novamente ou entre em contato por brunomedm@outlook.com");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="section-header mb-6" style={{ textAlign: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', margin: '0 auto'
        }}>
          <MessageSquare size={28} />
        </div>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)' }}>Envie seu Feedback</h1>
          <p className="text-secondary" style={{ fontSize: 15, marginTop: 4 }}>
            Sua opinião é muito importante! Sugestões, bugs ou elogios, queremos ouvir você. 😊
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '32px' }}>
        {success ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--accent-green)' }} className="animate-fade">
            <div style={{ 
              width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' 
            }}>
              <Heart size={32} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Feedback enviado!</h2>
            <p style={{ color: 'var(--text-muted)' }}>Obrigado pela sua contribuição. Isso ajuda a melhorar o sistema.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            <div>
              <label className="label mb-2">Tipo de Feedback</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                {TIPOS.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTipo(t.id)}
                    style={{
                      padding: '12px',
                      borderRadius: 12,
                      border: `1px solid ${tipo === t.id ? t.color : 'var(--border)'}`,
                      background: tipo === t.id ? `${t.color}15` : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      color: tipo === t.id ? t.color : 'var(--text-secondary)',
                      fontWeight: tipo === t.id ? 600 : 500,
                      transition: 'all 0.2s'
                    }}
                  >
                    <t.icon size={16} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="label">Assunto</label>
              <input 
                className="input" 
                placeholder="Resuma seu feedback em uma linha..." 
                value={assunto}
                onChange={e => setAssunto(e.target.value)}
                maxLength={100}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Mensagem detalhada</label>
              <textarea 
                className="input" 
                placeholder="Descreva seu feedback detalhadamente..." 
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
                minLength={10}
                required
                style={{ minHeight: 120, resize: 'vertical', paddingTop: 12 }}
              />
            </div>

            <div className="form-group">
              <label className="label">Seu e-mail (opcional, para recebermos contato)</label>
              <input 
                type="email"
                className="input" 
                placeholder="seu.email@exemplo.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ padding: '16px', fontSize: 16, marginTop: 8 }}
            >
              {loading ? <Loader2 size={20} className="spin" /> : <><Send size={18} /> Enviar Feedback</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
