import React, { useState, useEffect } from 'react';
import { LogOut, User, Monitor, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  showDashboardButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ showDashboardButton = false }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case 'admin':
        return 'Administrador';
      case 'attendant':
        return 'Atendente';
      case 'receptionist':
        return 'Recepcionista';
      default:
        return userType;
    }
  };

  const handleAdminClick = () => {
    navigate('/admin');
  };

  const handleSatisfactionClick = () => {
    navigate('/satisfaction');
  };

  const openDashboard = () => {
    const dashboardUrl = `${window.location.origin}/dashboard`;
    window.open(dashboardUrl, '_blank');
  };

  return (
    <header className="bg-gradient-to-r from-primary to-primary-hover shadow-shadow-primary border-b border-border">
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

          {/* Informações do Usuário */}
          {profile && (
            <div className="flex items-center space-x-4">
              <div className="text-right text-primary-foreground">
                <p className="font-medium">{profile.full_name}</p>
                <p className="text-sm text-primary-foreground/80">
                  {getUserTypeLabel(profile.user_type)}
                </p>
                {profile.location && (
                  <p className="text-xs text-primary-foreground/60">
                    📍 {profile.location}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-primary-foreground/20 p-2 rounded-full">
                  <User className="h-5 w-5 text-primary-foreground" />
                </div>
                {profile.user_type === 'admin' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAdminClick}
                    className="text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    Admin
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSatisfactionClick}
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Satisfação
                </Button>
                {showDashboardButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openDashboard}
                    className="text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;