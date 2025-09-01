
import React, { useEffect, useState, useRef } from 'react';
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Função para limpar recursos
  const cleanup = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      setCallPhase('bell');
      return;
    }

    console.log('🔔 INICIANDO CHAMADA:', customerName);
    
    const executeCallSequence = async () => {
      try {
        // ETAPA 1: Campainha + Mostrar popup (2 segundos)
        console.log('🔔 ETAPA 1: Tocando campainha...');
        setCallPhase('bell');
        
        // Tocar campainha
        playBell();
        
        // Aguardar 2 segundos
        await new Promise<void>((resolve) => {
          timeoutRef.current = setTimeout(() => {
            resolve();
          }, 2000);
        });
        
        // ETAPA 2: Chamada por voz (4 segundos)
        console.log('🔊 ETAPA 2: Chamada por voz...');
        setCallPhase('calling');
        
        // Chamar por voz
        await speakName(customerName, queueNumber, isAppointment);
        
        // Aguardar mais 1 segundo após a fala
        await new Promise<void>((resolve) => {
          timeoutRef.current = setTimeout(() => {
            resolve();
          }, 1000);
        });
        
        // ETAPA 3: Fechamento (1 segundo)
        console.log('✅ ETAPA 3: Finalizando...');
        setCallPhase('closing');
        
        await new Promise<void>((resolve) => {
          timeoutRef.current = setTimeout(() => {
            resolve();
          }, 1000);
        });
        
        // Fechar popup
        console.log('🔔 SEQUÊNCIA CONCLUÍDA');
        onClose();
        
      } catch (error) {
        console.error('❌ Erro na sequência de chamada:', error);
        onClose();
      }
    };

    executeCallSequence();

    // Cleanup quando componente desmontar ou isOpen mudar
    return cleanup;
  }, [isOpen, customerName, queueNumber, isAppointment, onClose]);

  const playBell = () => {
    try {
      console.log('🔔 Tocando campainha...');
      
      // Fechar contexto anterior se existir
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioContext = audioContextRef.current;
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Som de campainha - 3 toques rápidos
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.15);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.3);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.45);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.6);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.75);
      
      gainNode.gain.setValueAtTime(0.7, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.2);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 1.2);
      
      console.log('🔔 Campainha iniciada');
      
    } catch (error) {
      console.log('🔇 Erro ao tocar campainha:', error);
    }
  };

  const speakName = async (name: string, number: number, isAppointment: boolean): Promise<void> => {
    return new Promise<void>((resolve) => {
      try {
        console.log('🔊 Iniciando chamada por voz...');
        
        if (!window.speechSynthesis) {
          console.log('🔇 Text-to-speech não disponível');
          resolve();
          return;
        }

        // Cancelar qualquer fala anterior
        window.speechSynthesis.cancel();
        
        // Pequena pausa para garantir cancelamento
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance();
          
          // Texto da chamada
          if (isAppointment) {
            utterance.text = `${name}, compareça ao balcão para seu agendamento`;
          } else {
            utterance.text = `${name}, número ${number}, compareça ao balcão`;
          }
          
          // Configurações de voz
          utterance.lang = 'pt-BR';
          utterance.rate = 0.8;
          utterance.volume = 1.0;
          utterance.pitch = 1.0;
          
          let finished = false;
          
          utterance.onend = () => {
            console.log('🔊 Chamada por voz concluída');
            if (!finished) {
              finished = true;
              resolve();
            }
          };
          
          utterance.onerror = (event) => {
            console.log('🔇 Erro na chamada por voz:', event.error);
            if (!finished) {
              finished = true;
              resolve();
            }
          };
          
          // Timeout de segurança - se não acabar em 6 segundos, força resolve
          setTimeout(() => {
            if (!finished) {
              console.log('🔇 Timeout na chamada por voz - forçando conclusão');
              window.speechSynthesis.cancel();
              finished = true;
              resolve();
            }
          }, 6000);
          
          // Iniciar fala
          window.speechSynthesis.speak(utterance);
          console.log('🔊 Falando:', utterance.text);
          
        }, 200);
        
      } catch (error) {
        console.log('🔇 Erro geral na chamada por voz:', error);
        resolve();
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm flex items-center justify-center">
      <div className="w-full h-full flex items-center justify-center p-8">
        <Card className="w-full max-w-6xl bg-card border-2 shadow-2xl animate-in zoom-in-95 duration-300">
          <CardContent className="p-16 text-center space-y-12">
            {/* Fase da campainha */}
            {callPhase === 'bell' && (
              <div className="space-y-8">
                <div className="animate-pulse">
                  <Phone className="h-32 w-32 mx-auto text-primary animate-bounce" />
                </div>
                <h2 className="text-6xl font-bold text-primary animate-pulse">
                  Chamando...
                </h2>
              </div>
            )}

            {/* Fase da chamada */}
            {callPhase === 'calling' && (
              <div className="space-y-10">
                <div className="flex items-center justify-center">
                  <User className="h-24 w-24 text-primary" />
                </div>
                
                {/* Nome em destaque */}
                <div className="space-y-6">
                  <h1 className="text-9xl font-black text-primary tracking-wide uppercase animate-pulse">
                    {customerName}
                  </h1>
                  
                  {!isAppointment && (
                    <div className="text-7xl font-bold text-muted-foreground">
                      Senha {queueNumber}
                    </div>
                  )}
                </div>

                {/* Informações do serviço */}
                <div className="space-y-6">
                  <p className="text-4xl font-semibold text-muted-foreground">
                    {serviceName}
                  </p>
                  
                  <div className="flex items-center justify-center gap-6">
                    {isPriority && (
                      <Badge variant="destructive" className="text-xl px-6 py-3">
                        <AlertCircle className="h-6 w-6 mr-2" />
                        Prioritário
                      </Badge>
                    )}
                    
                    <Badge 
                      variant={isAppointment ? "outline" : "secondary"} 
                      className="text-xl px-6 py-3"
                    >
                      {isAppointment ? 'Agendamento' : 'Fila Geral'}
                    </Badge>
                  </div>
                </div>

                {/* Instrução */}
                <div className="text-3xl font-medium text-primary animate-pulse">
                  Compareça ao balcão
                </div>
              </div>
            )}

            {/* Fase de fechamento */}
            {callPhase === 'closing' && (
              <div className="space-y-8">
                <div className="animate-pulse">
                  <Phone className="h-20 w-20 mx-auto text-muted-foreground" />
                </div>
                <h2 className="text-4xl font-medium text-muted-foreground">
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

