import React from 'react';
import { LogOut, User, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  showDashboardButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ showDashboardButton = false }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

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
    window.open(
      dashboardUrl, 
      '_blank', 
      'toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,fullscreen=yes,width=' + screen.width + ',height=' + screen.height
    );
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
              className="h-16 w-16 object-contain"
            />
            <div>
              <h1 className="text-3xl font-bold text-primary-foreground">
                Sistema de Atendimento
              </h1>
              <p className="text-base text-primary-foreground/80">
                Prefeitura de Presidente Getúlio
              </p>
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