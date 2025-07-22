import React, { useState, useEffect } from 'react';
import { Monitor, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface DashboardHeaderProps {
  showBackButton?: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ showBackButton = false }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-gradient-to-r from-primary to-primary-hover shadow-md border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo e Título */}
          <div className="flex items-center space-x-4">
            <img 
              src="/lovable-uploads/ef74e05b-9b97-42ff-8531-33a04a68fd63.png" 
              alt="Brasão Presidente Getúlio" 
              className="h-20 w-20 object-contain"
            />
            <div>
              <h1 className="text-4xl font-bold text-primary-foreground">
                Sistema de Atendimento
              </h1>
              <p className="text-base text-primary-foreground/80">
                Prefeitura de Presidente Getúlio
              </p>
            </div>
          </div>

          {/* Relógio */}
          <div className="flex items-center bg-primary-foreground/10 px-4 py-3 rounded-lg">
            <Clock className="h-6 w-6 text-primary-foreground mr-3" />
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-foreground font-mono">
                {currentTime.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit' 
                })}
              </div>
              <div className="text-sm text-primary-foreground/80">
                {currentTime.toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>

          {/* Botões de Navegação */}
          <div className="flex items-center space-x-2">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Link>
              </Button>
            )}
            <div className="text-right text-primary-foreground">
              <p className="font-medium">Dashboard Público</p>
              <p className="text-sm text-primary-foreground/80">
                Monitoramento em tempo real
              </p>
            </div>
            <div className="bg-primary-foreground/20 p-2 rounded-full">
              <Monitor className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;