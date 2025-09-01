
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Phone, AlertCircle } from 'lucide-react';

interface CallPopupProps {
  isOpen: boolean;
  customerName: string;
  queueNumber: number;
  serviceName: string;
  isAppointment: boolean;
  isPriority?: boolean;
  onClose: () => void;
}

const CallPopup: React.FC<CallPopupProps> = ({
  isOpen,
  customerName,
  queueNumber,
  serviceName,
  isAppointment,
  isPriority = false,
  onClose
}) => {
  const [callPhase, setCallPhase] = useState<'bell' | 'calling' | 'closing'>('bell');

  useEffect(() => {
    if (!isOpen) return;

    const sequence = async () => {
      // Fase 1: Campainha (1 segundo)
      setCallPhase('bell');
      
      // Tocar campainha
      playBell();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fase 2: Chamada por voz (4 segundos)
      setCallPhase('calling');
      
      // Falar o nome duas vezes
      await speakName(customerName, queueNumber, isAppointment);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fase 3: Fechamento (1 segundo)
      setCallPhase('closing');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fechar popup
      onClose();
    };

    sequence();
  }, [isOpen, customerName, queueNumber, isAppointment, onClose]);

  const playBell = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Som de campainha mais forte e mais longo
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.8);
    } catch (error) {
      console.log('🔇 Som não disponível:', error);
    }
  };

  const speakName = async (name: string, number: number, isAppointment: boolean) => {
    return new Promise<void>((resolve) => {
      try {
        if (window.speechSynthesis) {
          // Cancelar qualquer fala anterior
          window.speechSynthesis.cancel();
          
          const utterance = new SpeechSynthesisUtterance();
          
          if (isAppointment) {
            utterance.text = `${name}, ${name}, compareça ao balcão para seu agendamento`;
          } else {
            utterance.text = `${name}, ${name}, número ${number}, compareça ao balcão`;
          }
          
          utterance.lang = 'pt-BR';
          utterance.rate = 0.8;
          utterance.volume = 1.0;
          utterance.pitch = 1.0;
          
          utterance.onend = () => {
            console.log('🔊 Chamada por voz concluída');
            resolve();
          };
          
          utterance.onerror = () => {
            console.log('🔇 Erro na chamada por voz');
            resolve();
          };
          
          window.speechSynthesis.speak(utterance);
          console.log('🔊 Chamando:', utterance.text);
        } else {
          resolve();
        }
      } catch (error) {
        console.log('🔇 Text-to-speech não disponível:', error);
        resolve();
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm flex items-center justify-center">
      <div className="w-full h-full flex items-center justify-center p-8">
        <Card className="w-full max-w-4xl bg-card border-2 shadow-2xl animate-in zoom-in-95 duration-300">
          <CardContent className="p-12 text-center space-y-8">
            {/* Fase da campainha */}
            {callPhase === 'bell' && (
              <div className="space-y-6">
                <div className="animate-pulse">
                  <Phone className="h-24 w-24 mx-auto text-primary animate-bounce" />
                </div>
                <h2 className="text-4xl font-bold text-primary animate-pulse">
                  Chamando...
                </h2>
              </div>
            )}

            {/* Fase da chamada */}
            {callPhase === 'calling' && (
              <div className="space-y-8">
                <div className="flex items-center justify-center">
                  <User className="h-20 w-20 text-primary" />
                </div>
                
                {/* Nome em destaque */}
                <div className="space-y-4">
                  <h1 className="text-8xl font-black text-primary tracking-wide uppercase animate-pulse">
                    {customerName}
                  </h1>
                  
                  {!isAppointment && (
                    <div className="text-6xl font-bold text-muted-foreground">
                      Senha {queueNumber}
                    </div>
                  )}
                </div>

                {/* Informações do serviço */}
                <div className="space-y-4">
                  <p className="text-3xl font-semibold text-muted-foreground">
                    {serviceName}
                  </p>
                  
                  <div className="flex items-center justify-center gap-4">
                    {isPriority && (
                      <Badge variant="destructive" className="text-lg px-4 py-2">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        Prioritário
                      </Badge>
                    )}
                    
                    <Badge 
                      variant={isAppointment ? "outline" : "secondary"} 
                      className="text-lg px-4 py-2"
                    >
                      {isAppointment ? 'Agendamento' : 'Fila Geral'}
                    </Badge>
                  </div>
                </div>

                {/* Instrução */}
                <div className="text-2xl font-medium text-primary animate-pulse">
                  Compareça ao balcão
                </div>
              </div>
            )}

            {/* Fase de fechamento */}
            {callPhase === 'closing' && (
              <div className="space-y-6">
                <div className="animate-pulse">
                  <Phone className="h-16 w-16 mx-auto text-muted-foreground" />
                </div>
                <h2 className="text-3xl font-medium text-muted-foreground">
                  Chamada concluída
                </h2>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CallPopup;
