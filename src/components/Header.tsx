import React, { useState, useEffect } from 'react';
import { LogOut, User, Monitor, Clock, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
      <div className="container mx-auto px-4 py-3 lg:px-6 lg:py-4">
        <div className="flex items-center justify-between">
          {/* Logo e Título */}
          <div className="flex items-center space-x-2 lg:space-x-4">
            <img 
              src="/lovable-uploads/ef74e05b-9b97-42ff-8531-33a04a68fd63.png" 
              alt="Brasão Presidente Getúlio" 
              className="h-12 w-12 lg:h-20 lg:w-20 object-contain"
            />
            <div className="hidden sm:block">
              <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-primary-foreground">
                Sistema de Atendimento
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-primary-foreground/80">
                Prefeitura de Presidente Getúlio
              </p>
            </div>
            <div className="block sm:hidden">
              <h1 className="text-lg font-bold text-primary-foreground">
                Getúlio Atende
              </h1>
            </div>
          </div>

          {/* Desktop - Relógio e Menu */}
          <div className="hidden lg:flex items-center space-x-4">
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

            {/* Desktop User Menu */}
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

          {/* Mobile Menu */}
          {profile && (
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-background">
                  <div className="flex flex-col space-y-6 pt-6">
                    {/* User Info */}
                    <div className="flex items-center space-x-3 pb-4 border-b border-border">
                      <div className="bg-primary/20 p-3 rounded-full">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{profile.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {getUserTypeLabel(profile.user_type)}
                        </p>
                        {profile.location && (
                          <p className="text-xs text-muted-foreground">
                            📍 {profile.location}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Clock */}
                    <div className="flex items-center justify-center bg-muted/50 p-4 rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground font-mono">
                          {currentTime.toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            second: '2-digit' 
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {currentTime.toLocaleDateString('pt-BR', { 
                            weekday: 'long', 
                            day: 'numeric',
                            month: 'short'
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="flex flex-col space-y-3">
                      {profile.user_type === 'admin' && (
                        <Button
                          variant="ghost"
                          onClick={handleAdminClick}
                          className="justify-start h-12 text-base"
                        >
                          <User className="h-5 w-5 mr-3" />
                          Administração
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        onClick={handleSatisfactionClick}
                        className="justify-start h-12 text-base"
                      >
                        <Monitor className="h-5 w-5 mr-3" />
                        Pesquisa Satisfação
                      </Button>
                      {showDashboardButton && (
                        <Button
                          variant="ghost"
                          onClick={openDashboard}
                          className="justify-start h-12 text-base"
                        >
                          <Monitor className="h-5 w-5 mr-3" />
                          Dashboard
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        onClick={handleSignOut}
                        className="justify-start h-12 text-base mt-6"
                      >
                        <LogOut className="h-5 w-5 mr-3" />
                        Sair do Sistema
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;