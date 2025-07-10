import React, { useState, useEffect } from 'react';
import { Plus, User, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';

interface Service {
  id: string;
  name: string;
  estimated_time: number;
}

interface QueueCustomer {
  id: string;
  name: string;
  phone: string;
  queue_number: number;
  service_id: string;
  is_priority: boolean;
  status: string;
  created_at: string;
  services: { name: string };
}

const Reception: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [queueCustomers, setQueueCustomers] = useState<QueueCustomer[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [isPriority, setIsPriority] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customerHistory, setCustomerHistory] = useState<Array<{name: string, phone: string}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
    fetchQueueCustomers();
    fetchCustomerHistory();
    
    // Configurar real-time para a fila
    const channel = supabase
      .channel('queue-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue_customers' },
        () => { fetchQueueCustomers(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('active', true)
      .order('name');
    
    if (error) {
      console.error('Erro ao buscar serviços:', error);
      return;
    }
    
    setServices(data || []);
  };

  const fetchQueueCustomers = async () => {
    const { data, error } = await supabase
      .from('queue_customers')
      .select(`
        *,
        services:service_id (name)
      `)
      .eq('status', 'waiting')
      .order('queue_number');
    
    if (error) {
      console.error('Erro ao buscar fila:', error);
      return;
    }
    
    setQueueCustomers(data || []);
  };

  const fetchCustomerHistory = async () => {
    const { data, error } = await supabase
      .from('queue_customers')
      .select('name, phone')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error('Erro ao buscar histórico:', error);
      return;
    }
    
    // Remove duplicates based on name
    const uniqueCustomers = data?.reduce((acc: Array<{name: string, phone: string}>, curr) => {
      if (!acc.find(item => item.name.toLowerCase() === curr.name.toLowerCase())) {
        acc.push(curr);
      }
      return acc;
    }, []) || [];
    
    setCustomerHistory(uniqueCustomers);
  };

  const addToQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName || !customerPhone || !selectedService) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Obter próximo número da fila
      const { data: nextNumber, error: numberError } = await supabase
        .rpc('get_next_queue_number');
      
      if (numberError) {
        throw numberError;
      }

      // Adicionar cidadão à fila
      const { error } = await supabase
        .from('queue_customers')
        .insert({
          name: customerName,
          phone: customerPhone,
          service_id: selectedService,
          queue_number: nextNumber,
          is_priority: isPriority,
          status: 'waiting'
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Cidadão adicionado à fila",
        description: `${customerName} foi adicionado à fila com o número ${nextNumber}`,
      });

      // Limpar formulário
      setCustomerName('');
      setCustomerPhone('');
      setSelectedService('');
      setIsPriority(false);
      
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar cidadão",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const getWaitingTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    return diffInMinutes;
  };

  const handleNameChange = (value: string) => {
    setCustomerName(value);
    setShowSuggestions(value.length > 0);
  };

  const selectCustomer = (customer: {name: string, phone: string}) => {
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setShowSuggestions(false);
  };

  const filteredCustomers = customerHistory.filter(customer =>
    customer.name.toLowerCase().includes(customerName.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de Adicionar Cidadão */}
          <Card className="shadow-shadow-card">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Adicionar Cidadão à Fila
              </CardTitle>
              <CardDescription>
                Cadastre um novo cidadão na fila de atendimento
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={addToQueue} className="space-y-4">
                <div className="relative">
                  <Label htmlFor="name">Nome do Cidadão</Label>
                  <Input
                    id="name"
                    value={customerName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onFocus={() => setShowSuggestions(customerName.length > 0)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Digite o nome completo"
                    required
                  />
                  {showSuggestions && filteredCustomers.length > 0 && (
                    <div className="absolute z-10 w-full bg-background border border-border rounded-md mt-1 shadow-lg max-h-40 overflow-y-auto">
                      {filteredCustomers.map((customer, index) => (
                        <div
                          key={index}
                          className="p-2 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                          onClick={() => selectCustomer(customer)}
                        >
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">{customer.phone}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(47) 99999-9999"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="service">Serviço</Label>
                  <Select value={selectedService} onValueChange={setSelectedService} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} ({service.estimated_time} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="priority"
                    checked={isPriority}
                    onCheckedChange={setIsPriority}
                  />
                  <Label htmlFor="priority" className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Atendimento Prioritário
                  </Label>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Adicionando...' : 'Adicionar à Fila'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Fila Atual */}
          <Card className="shadow-shadow-card">
            <CardHeader className="bg-gradient-to-r from-secondary/10 to-success/10">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Fila Atual ({queueCustomers.length} pessoas)
              </CardTitle>
              <CardDescription>
                Cidadãos aguardando atendimento
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {queueCustomers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum cidadão na fila
                  </p>
                ) : (
                  queueCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className={`p-4 rounded-lg border ${
                        customer.is_priority
                          ? 'border-destructive bg-destructive/5'
                          : 'border-border bg-card'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant={customer.is_priority ? "destructive" : "secondary"}>
                              #{customer.queue_number}
                            </Badge>
                            {customer.is_priority && (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Prioritário
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium">{customer.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {customer.services?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {customer.phone}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            {getWaitingTime(customer.created_at)} min
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reception;