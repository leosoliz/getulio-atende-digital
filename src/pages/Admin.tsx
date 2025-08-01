import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Search, BarChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import AttendantReports from '@/components/AttendantReports';

interface UserProfile {
  id: string;
  full_name: string;
  user_type: string;
  location: string | null;
  created_at: string;
}

interface UserFormData {
  email: string;
  password: string;
  full_name: string;
  user_type: string;
  location: string;
  services: string[];
}

interface Service {
  id: string;
  name: string;
  active: boolean;
}

const Admin: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [userServices, setUserServices] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    full_name: '',
    user_type: 'attendant',
    location: '',
    services: []
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchServices();
    fetchUserServices();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar serviços",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchUserServices = async () => {
    try {
      const { data, error } = await supabase
        .from('attendant_services')
        .select('attendant_id, service_id');

      if (error) throw error;
      
      const servicesMap: Record<string, string[]> = {};
      data?.forEach(item => {
        if (!servicesMap[item.attendant_id]) {
          servicesMap[item.attendant_id] = [];
        }
        servicesMap[item.attendant_id].push(item.service_id);
      });
      
      setUserServices(servicesMap);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar serviços dos usuários",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingUser) {
        // Atualizar usuário existente
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            user_type: formData.user_type,
            location: formData.location || null
          })
          .eq('id', editingUser.id);

        if (error) throw error;

        // Atualizar serviços do atendente se for atendente
        if (formData.user_type === 'attendant') {
          await updateUserServices(editingUser.id, formData.services);
        }

        toast({
          title: "Usuário atualizado",
          description: "As informações do usuário foram atualizadas com sucesso",
        });
      } else {
        // Criar novo usuário
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
              user_type: formData.user_type,
              location: formData.location || null
            }
          }
        });

        if (authError) throw authError;

        // Adicionar serviços do atendente se for atendente e tiver user_id
        if (formData.user_type === 'attendant' && authData.user?.id) {
          await updateUserServices(authData.user.id, formData.services);
        }

        toast({
          title: "Usuário criado",
          description: "O novo usuário foi criado com sucesso",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchUsers();
      fetchUserServices();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar usuário",
        description: error.message,
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const updateUserServices = async (userId: string, serviceIds: string[]) => {
    // Remover serviços existentes
    await supabase
      .from('attendant_services')
      .delete()
      .eq('attendant_id', userId);

    // Adicionar novos serviços
    if (serviceIds.length > 0) {
      const servicesData = serviceIds.map(serviceId => ({
        attendant_id: userId,
        service_id: serviceId
      }));

      const { error } = await supabase
        .from('attendant_services')
        .insert(servicesData);

      if (error) throw error;
    }
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      email: '',
      password: '',
      full_name: user.full_name,
      user_type: user.user_type,
      location: user.location || '',
      services: userServices[user.id] || []
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      full_name: '',
      user_type: 'attendant',
      location: '',
      services: []
    });
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

  const getUserTypeVariant = (userType: string) => {
    switch (userType) {
      case 'admin':
        return 'destructive';
      case 'attendant':
        return 'default';
      case 'receptionist':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.location && user.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/20 to-accent/20">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Administração</h1>
          <p className="text-muted-foreground">
            Gerencie usuários e visualize relatórios do sistema
          </p>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">

        {/* Barra de Busca e Novo Usuário */}
        <Card className="mb-8 shadow-shadow-card">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingUser 
                        ? 'Atualize as informações do usuário'
                        : 'Preencha os dados para criar um novo usuário'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {!editingUser && (
                      <>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="password">Senha</Label>
                          <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            minLength={6}
                          />
                        </div>
                      </>
                    )}
                    
                    <div>
                      <Label htmlFor="full_name">Nome Completo</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="user_type">Tipo de Usuário</Label>
                      <Select value={formData.user_type} onValueChange={(value) => setFormData({ ...formData, user_type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="attendant">Atendente</SelectItem>
                          <SelectItem value="receptionist">Recepcionista</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="location">Local de Trabalho</Label>
                      <Input
                        id="location"
                        placeholder="ex: Mesa 3, Guichê 1, Sala 5"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>

                    {formData.user_type === 'attendant' && (
                      <div>
                        <Label>Serviços Prestados</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                          {services.map((service) => (
                            <div key={service.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={service.id}
                                checked={formData.services.includes(service.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({
                                      ...formData,
                                      services: [...formData.services, service.id]
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      services: formData.services.filter(id => id !== service.id)
                                    });
                                  }
                                }}
                              />
                              <Label htmlFor={service.id} className="text-sm">
                                {service.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" disabled={loading} className="flex-1">
                        {loading ? 'Salvando...' : editingUser ? 'Atualizar' : 'Criar'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                        disabled={loading}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Usuários */}
        <Card className="shadow-shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários ({filteredUsers.length})
            </CardTitle>
            <CardDescription>
              Lista de todos os usuários do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum usuário encontrado</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Tente ajustar sua busca' : 'Comece criando um novo usuário'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg">{user.full_name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getUserTypeVariant(user.user_type) as any}>
                            {getUserTypeLabel(user.user_type)}
                          </Badge>
                        </div>
                        {user.location && (
                          <p className="text-sm text-muted-foreground mt-2">
                            📍 {user.location}
                          </p>
                        )}
                        {user.user_type === 'attendant' && userServices[user.id] && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Serviços:</p>
                            <div className="flex flex-wrap gap-1">
                              {userServices[user.id].map((serviceId) => {
                                const service = services.find(s => s.id === serviceId);
                                return service ? (
                                  <Badge key={serviceId} variant="outline" className="text-xs">
                                    {service.name}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(user)}
                        className="shrink-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Criado em {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <AttendantReports />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;