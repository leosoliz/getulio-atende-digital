import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Users, AlertCircle } from 'lucide-react';

interface QueueNotificationPopupProps {
  isOpen: boolean;
  queueLength: number;
  onClose: () => void;
}

const QueueNotificationPopup: React.FC<QueueNotificationPopupProps> = ({
  isOpen,
  queueLength,
  onClose
}) => {
  const [soundPlayed, setSoundPlayed] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Tocar som de notificação
    if (!soundPlayed) {
      playNotificationSound();
      setSoundPlayed(true);
    }

    // Alterar título da página para chamar atenção
    const originalTitle = document.title;
    document.title = `🔔 ${queueLength} pessoa(s) aguardando - Atendente`;

    // Mostrar notificação do browser se permitido
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Nova pessoa na fila!', {
        body: `${queueLength} pessoa(s) aguardando atendimento`,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png'
      });
    }

    // Fechar automaticamente após 4 segundos
    const timer = setTimeout(() => {
      onClose();
      document.title = originalTitle;
      setSoundPlayed(false);
    }, 4000);

    return () => {
      clearTimeout(timer);
      document.title = originalTitle;
    };
  }, [isOpen, queueLength, onClose, soundPlayed]);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Som de notificação suave mas chamativo
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.4);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.6);
    } catch (error) {
      console.log('🔇 Som não disponível:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-in zoom-in-95 duration-300">
      <Card className="w-80 bg-primary shadow-2xl border-2 border-primary-foreground/20">
        <CardContent className="p-4 text-center space-y-3">
          <div className="flex items-center justify-center">
            <div className="relative">
              <Users className="h-8 w-8 text-primary-foreground animate-pulse" />
              <div className="absolute -top-1 -right-1">
                <AlertCircle className="h-4 w-4 text-destructive animate-bounce" />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-primary-foreground">
              Nova pessoa na fila!
            </h3>
            
            <div className="text-primary-foreground/90">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {queueLength} {queueLength === 1 ? 'pessoa aguardando' : 'pessoas aguardando'}
              </Badge>
            </div>
            
            <p className="text-sm text-primary-foreground/80">
              Há pessoas aguardando seu atendimento
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QueueNotificationPopup;