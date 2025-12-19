
import React, { useState } from 'react';
import { ArrowUpIcon, ArrowDownIcon, CheckIcon, ChevronRightIcon, ChevronLeftIcon, TargetIcon, ClockIcon, MedalIcon } from './Icons';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      onClose();
      setTimeout(() => setStep(0), 300); // Reset for next time
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col items-center text-center space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-2">
              <MedalIcon className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sistema de Patentes</h3>
              <p className="text-gray-600 leading-relaxed">
                Seu objetivo é subir de nível! A cada <strong>5 acertos</strong>, você desbloqueia uma nova patente.
                <br/><br/>
                Inicie como <span className="text-purple-600 font-bold">Curioso</span> e tente alcançar o posto de <span className="text-purple-600 font-bold">Mestre</span>.
              </p>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
            <h3 className="text-xl font-bold text-gray-900 text-center mb-4">Dicas de Chute</h3>
            
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <ArrowUpIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="block font-bold text-gray-900">É Maior</span>
                <span className="text-xs text-gray-500">A resposta está acima do seu palpite.</span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg">
              <div className="p-2 bg-orange-100 text-orange-700 rounded-lg">
                <ArrowDownIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="block font-bold text-gray-900">É Menor</span>
                <span className="text-xs text-gray-500">A resposta está abaixo do seu palpite.</span>
              </div>
            </div>

            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 mt-2">
              <p className="text-xs text-purple-700 text-center leading-relaxed">
                A barra de <strong>Proximidade</strong> indica o quão perto você está do número correto.
              </p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-center text-center space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-2">
              <ClockIcon className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">O Tempo é Valioso</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Você começa com <strong>60 segundos</strong>. Cada acerto recupera tempo.
              </p>
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl font-medium text-xs border border-red-100">
                ⚠️ <span className="font-bold">Atenção:</span> Quanto maior sua patente, <span className="font-bold">menos tempo</span> você ganha por acerto!
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center text-center space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2">
              <TargetIcon className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Limite de Chances</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Você tem um número limitado de tentativas por pergunta.
              </p>
              <p className="text-gray-500 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                Em patentes altas, o jogo exige precisão extrema: você terá <strong>menos tentativas</strong> para acertar!
              </p>
              <p className="text-purple-600 font-black text-xs mt-4 uppercase tracking-widest">
                Acabou o tempo ou as chances? GAME OVER.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col h-[520px]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 pb-2">
          <h2 className="text-lg font-bold text-gray-400 uppercase tracking-widest">Guia de Jogo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
            <span className="text-2xl leading-none">&times;</span>
          </button>
        </div>

        {/* Content Area - Fixed Height for stability */}
        <div className="flex-1 px-8 py-4 flex flex-col justify-center">
            {renderStepContent()}
        </div>

        {/* Footer Navigation */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
                
                {/* Back Button */}
                <button 
                    onClick={handlePrev} 
                    disabled={step === 0}
                    className={`
                        w-10 h-10 flex items-center justify-center rounded-full transition-all
                        ${step === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-white hover:shadow-md'}
                    `}
                >
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>

                {/* Indicators */}
                <div className="flex gap-2">
                    {Array.from({ length: totalSteps }).map((_, idx) => (
                        <div 
                            key={idx}
                            className={`
                                h-2 rounded-full transition-all duration-300
                                ${step === idx ? 'w-6 bg-purple-600' : 'w-2 bg-purple-200'}
                            `}
                        />
                    ))}
                </div>

                {/* Next Button */}
                <button 
                    onClick={handleNext}
                    className="flex items-center gap-1 pl-4 pr-2 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold text-sm shadow-lg shadow-purple-200 transition-all active:scale-95"
                >
                    <span>{step === totalSteps - 1 ? 'Entendi' : 'Próximo'}</span>
                    <ChevronRightIcon className="w-5 h-5" />
                </button>

            </div>
        </div>

      </div>
    </div>
  );
};

export default InfoModal;
