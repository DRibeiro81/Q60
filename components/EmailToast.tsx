import React, { useEffect, useState } from 'react';
import { MailIcon } from './Icons';

interface EmailData {
  email: string;
  code: string;
  nickname: string;
}

export const EmailToast: React.FC = () => {
  const [notification, setNotification] = useState<EmailData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<EmailData>;
      setNotification(customEvent.detail);
      setVisible(true);

      // Play notification sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); 
      audio.volume = 0.5;
      audio.play().catch(() => {}); // Ignore interaction errors

      // Auto hide after 8 seconds
      setTimeout(() => {
        setVisible(false);
      }, 8000);
    };

    window.addEventListener('quiz60:mock_email', handler);
    return () => window.removeEventListener('quiz60:mock_email', handler);
  }, []);

  if (!notification) return null;

  return (
    <div 
      className={`fixed top-4 right-4 z-[100] max-w-sm w-full bg-white shadow-2xl rounded-xl border border-gray-100 overflow-hidden transition-all duration-500 transform ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
        {/* Fake "Notification Center" Header */}
        <div className="bg-gray-900 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="bg-blue-500 p-1 rounded">
                    <MailIcon className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-200 font-bold text-xs uppercase tracking-wider">E-mail • Agora</span>
            </div>
        </div>

        <div className="p-4 bg-white/95 backdrop-blur-sm cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setVisible(false)}>
            <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-gray-900 text-sm">no-reply@quiz60.com</h4>
            </div>
            <p className="font-semibold text-gray-700 text-xs mb-2">Seu código de acesso Quiz60</p>
            
            <div className="text-gray-600 text-xs leading-relaxed">
                Olá {notification.nickname},<br/>
                Seu código de verificação é:
            </div>
            
            <div className="mt-2 bg-gray-100 border border-gray-200 rounded p-2 text-center">
                 <span className="text-xl font-black text-purple-600 tracking-[0.2em] font-mono select-all">
                    {notification.code}
                 </span>
            </div>
            <p className="text-[9px] text-gray-400 mt-2 text-center italic">
                (Isso é uma simulação. Em produção, este e-mail seria enviado via SMTP)
            </p>
        </div>
    </div>
  );
};

export default EmailToast;