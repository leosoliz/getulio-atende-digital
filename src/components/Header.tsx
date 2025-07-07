import React from 'react';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
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

  return (
    <header className="bg-gradient-to-r from-primary to-primary-hover shadow-shadow-primary border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo e Título */}
          <div className="flex items-center space-x-4">
            <img 
              src="/lovable-uploads/ef74e05b-9b97-42ff-8531-33a04a68fd63.png" 
              alt="Brasão Presidente Getúlio" 
              className="h-12 w-12 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">
                Sistema de Atendimento
              </h1>
              <p className="text-sm text-primary-foreground/80">
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
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-primary-foreground/20 p-2 rounded-full">
                  <User className="h-5 w-5 text-primary-foreground" />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
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