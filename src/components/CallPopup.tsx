
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
  const sequenceAbortRef = useRef<AbortController | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Cancelar sequência anterior se estiver rodando
      if (sequenceAbortRef.current) {
        sequenceAbortRef.current.abort();
      }
      // Cancelar qualquer fala pendente
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      // Fechar contexto de áudio
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      return;
    }

    const runSequence = async () => {
      // Criar novo controlador para esta sequência
      sequenceAbortRef.current = new AbortController();
      const signal = sequenceAbortRef.current.signal;

      try {
        console.log('🔔 Iniciando sequência de chamada para:', customerName);
        
        // Fase 1: Campainha (2 segundos)
        if (signal.aborted) return;
        setCallPhase('bell');
        console.log('🔔 Fase 1: Tocando campainha...');
        
        await playBell();
        await delay(2000, signal);
        
        // Fase 2: Chamada por voz (5 segundos)
        if (signal.aborted) return;
        setCallPhase('calling');
        console.log('🔊 Fase 2: Chamada por voz...');
        
        await speakName(customerName, queueNumber, isAppointment, signal);
        await delay(1000, signal);
        
        // Fase 3: Fechamento (1 segundo)
        if (signal.aborted) return;
        setCallPhase('closing');
        console.log('✅ Fase 3: Finalizando...');
        
        await delay(1000, signal);
        
        // Fechar popup
        if (!signal.aborted) {
          console.log('🔔 Sequência concluída, fechando popup');
          onClose();
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('🔔 Sequência cancelada');
        } else {
          console.error('🔔 Erro na sequência:', error);
          onClose();
        }
      }
    };

    runSequence();

    // Cleanup quando o componente for desmontado ou isOpen mudar
    return () => {
      if (sequenceAbortRef.current) {
        sequenceAbortRef.current.abort();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [isOpen, customerName, queueNumber, isAppointment, onClose]);

  const delay = (ms: number, signal?: AbortSignal): Promise<void> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);
      
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('Aborted'));
        });
      }
    });
  };

  const playBell = async (): Promise<void> => {
    return new Promise((resolve) => {
      try {
        // Usar contexto de áudio reutilizável
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        const audioContext = audioContextRef.current;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Som de campainha melhorado - tocar 3 vezes
        let currentTime = audioContext.currentTime;
        
        // Primeira campainha
        oscillator.frequency.setValueAtTime(800, currentTime);
        oscillator.frequency.setValueAtTime(1000, currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.6, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3);
        
        // Segunda campainha (após pausa)
        oscillator.frequency.setValueAtTime(800, currentTime + 0.5);
        oscillator.frequency.setValueAtTime(1000, currentTime + 0.6);
        oscillator.frequency.setValueAtTime(800, currentTime + 0.7);
        
        gainNode.gain.setValueAtTime(0.6, currentTime + 0.5);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.8);
        
        // Terceira campainha (após pausa)
        oscillator.frequency.setValueAtTime(800, currentTime + 1.0);
        oscillator.frequency.setValueAtTime(1000, currentTime + 1.1);
        oscillator.frequency.setValueAtTime(800, currentTime + 1.2);
        
        gainNode.gain.setValueAtTime(0.6, currentTime + 1.0);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 1.3);
        
        oscillator.start();
        oscillator.stop(currentTime + 1.5);
        
        oscillator.onended = () => {
          console.log('🔔 Campainha concluída');
          resolve();
        };
        
        // Fallback caso onended não funcione
        setTimeout(() => {
          resolve();
        }, 1600);
        
      } catch (error) {
        console.log('🔇 Som não disponível:', error);
        resolve();
      }
    });
  };

  const speakName = async (name: string, number: number, isAppointment: boolean, signal?: AbortSignal): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      try {
        if (signal?.aborted) {
          reject(new Error('Aborted'));
          return;
        }
        
        if (!window.speechSynthesis) {
          console.log('🔇 Text-to-speech não disponível');
          resolve();
          return;
        }

        // Cancelar qualquer fala anterior
        window.speechSynthesis.cancel();
        
        // Aguardar um pouco para garantir que a fala anterior foi cancelada
        setTimeout(() => {
          if (signal?.aborted) {
            reject(new Error('Aborted'));
            return;
          }
          
          const utterance = new SpeechSynthesisUtterance();
          
          if (isAppointment) {
            utterance.text = `${name}, ${name}, compareça ao balcão para seu agendamento`;
          } else {
            utterance.text = `${name}, ${name}, número ${number}, compareça ao balcão`;
          }
          
          utterance.lang = 'pt-BR';
          utterance.rate = 0.7; // Mais devagar para melhor compreensão
          utterance.volume = 1.0;
          utterance.pitch = 1.0;
          
          let resolved = false;
          
          utterance.onend = () => {
            console.log('🔊 Chamada por voz concluída');
            if (!resolved) {
              resolved = true;
              resolve();
            }
          };
          
          utterance.onerror = (event) => {
            console.log('🔇 Erro na chamada por voz:', event.error);
            if (!resolved) {
              resolved = true;
              resolve();
            }
          };
          
          // Timeout de segurança
          setTimeout(() => {
            if (!resolved) {
              console.log('🔇 Timeout na chamada por voz');
              resolved = true;
              resolve();
            }
          }, 8000);
          
          // Registrar listener para abort signal
          if (signal) {
            signal.addEventListener('abort', () => {
              window.speechSynthesis.cancel();
              if (!resolved) {
                resolved = true;
                reject(new Error('Aborted'));
              }
            });
          }
          
          window.speechSynthesis.speak(utterance);
          console.log('🔊 Chamando:', utterance.text);
        }, 100);
        
      } catch (error) {
        console.log('🔇 Text-to-speech erro:', error);
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
