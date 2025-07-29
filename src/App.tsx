import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Auth from "./pages/Auth";
import Reception from "./pages/Reception";
import Attendant from "./pages/Attendant";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import SatisfactionSurvey from "./pages/SatisfactionSurvey";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Componente para proteger rotas
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles?: string[] 
}> = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Carregando...</p>
      </div>
    </div>;
  }

  if (!user || !profile) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.user_type)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Componente para redirecionar baseado no tipo de usuário
const RoleBasedRedirect: React.FC = () => {
  const { profile, loading, user } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Carregando...</p>
      </div>
    </div>;
  }

  if (!user || !profile) {
    return <Navigate to="/auth" replace />;
  }

  // Redirecionar baseado no tipo de usuário apenas uma vez
  const targetRoute = (() => {
    switch (profile.user_type) {
      case 'receptionist':
        return '/reception';
      case 'attendant':
        return '/attendant';
      case 'admin':
        return '/admin';
      default:
        return '/dashboard';
    }
  })();

  return <Navigate to={targetRoute} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<RoleBasedRedirect />} />
            <Route path="/reception" element={
              <ProtectedRoute allowedRoles={['receptionist', 'admin']}>
                <Reception />
              </ProtectedRoute>
            } />
            <Route path="/attendant" element={
              <ProtectedRoute allowedRoles={['attendant', 'admin']}>
                <Attendant />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="/satisfaction" element={<SatisfactionSurvey />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
