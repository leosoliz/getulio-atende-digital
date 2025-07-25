
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Star, CheckCircle, AlertCircle, Users, Clock, User, X } from 'lucide-react';

interface CompletedService {
  id: string;
  name: string;
  phone: string;
  service_name: string;
  completed_at: string;
  attendant_id: string;
  type: 'queue' | 'identity' | 'whatsapp';
}

const SatisfactionSurvey: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [overallRating, setOverallRating] = useState('');
  const [problemResolved, setProblemResolved] = useState('');
  const [improvementAspect, setImprovementAspect] = useState('');
  const [linkExpired, setLinkExpired] = useState(false);
  const [showServiceList, setShowServiceList] = useState(false);
  const [completedServices, setCompletedServices] = useState<CompletedService[]>([]);
  const [selectedService, setSelectedService] = useState<CompletedService | null>(null);
  const [loadingServices, setLoadingServices] = useState(false);
  
  // Get parameters from URL
  const attendantId = searchParams.get('attendant_id');
  const queueCustomerId = searchParams.get('queue_customer_id');
  const identityAppointmentId = searchParams.get('identity_appointment_id');
  const whatsappServiceId = searchParams.get('whatsapp_service_id');

  useEffect(() => {
    const validateLink = async () => {
      // Se há parâmetros específicos, usar o fluxo de link direto
      if (attendantId && (queueCustomerId || identityAppointmentId || whatsappServiceId)) {
        // Verificar se já existe uma pesquisa respondida para este link
        try {
          let query = supabase
            .from('satisfaction_surveys')
            .select('id')
            .eq('attendant_id', attendantId);

          // Adicionar filtro específico baseado no tipo de atendimento
          if (queueCustomerId) {
            query = query.eq('queue_customer_id', queueCustomerId);
          } else if (identityAppointmentId) {
            query = query.eq('identity_appointment_id', identityAppointmentId);
          } else if (whatsappServiceId) {
            query = query.eq('whatsapp_service_id', whatsappServiceId);
          }

          const { data: existingSurvey, error } = await query.maybeSingle();

          if (error) {
            console.error('Erro ao verificar pesquisa existente:', error);
            return;
          }

          if (existingSurvey) {
            // Pesquisa já foi respondida
            setLinkExpired(true);
            toast({
              title: "Link expirado",
              description: "Esta pesquisa já foi respondida anteriormente",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Erro ao validar link:', error);
        }
      } else {
        // Se não há parâmetros específicos, mostrar lista de serviços
        setShowServiceList(true);
        loadCompletedServices();
      }
    };

    validateLink();
  }, [attendantId, queueCustomerId, identityAppointmentId, whatsappServiceId, toast]);

  const loadCompletedServices = async () => {
    setLoadingServices(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Buscar atendimentos da fila completados
      const { data: queueData, error: queueError } = await supabase
        .from('queue_customers')
        .select(`
          id, name, phone, completed_at, attendant_id,
          services!inner(name)
        `)
        .eq('status', 'completed')
        .gte('completed_at', `${today}T00:00:00`)
        .lte('completed_at', `${today}T23:59:59`)
        .order('completed_at', { ascending: false });

      // Buscar agendamentos de identidade completados
      const { data: identityData, error: identityError } = await supabase
        .from('identity_appointments')
        .select('id, name, phone, completed_at, attendant_id')
        .eq('status', 'completed')
        .gte('completed_at', `${today}T00:00:00`)
        .lte('completed_at', `${today}T23:59:59`)
        .order('completed_at', { ascending: false });

      // Buscar atendimentos WhatsApp (sempre considerados completados)
      const { data: whatsappData, error: whatsappError } = await supabase
        .from('whatsapp_services')
        .select(`
          id, name, phone, created_at, attendant_id,
          services!inner(name)
        `)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .order('created_at', { ascending: false });

      if (queueError || identityError || whatsappError) {
        console.error('Erro ao carregar serviços:', { queueError, identityError, whatsappError });
        return;
      }

      const services: CompletedService[] = [];

      // Adicionar serviços da fila
      queueData?.forEach(item => {
        services.push({
          id: item.id,
          name: item.name,
          phone: item.phone,
          service_name: (item.services as any)?.name || 'Atendimento Presencial',
          completed_at: item.completed_at,
          attendant_id: item.attendant_id,
          type: 'queue'
        });
      });

      // Adicionar agendamentos de identidade
      identityData?.forEach(item => {
        services.push({
          id: item.id,
          name: item.name,
          phone: item.phone,
          service_name: 'Agendamento de Identidade',
          completed_at: item.completed_at,
          attendant_id: item.attendant_id,
          type: 'identity'
        });
      });

      // Adicionar atendimentos WhatsApp
      whatsappData?.forEach(item => {
        services.push({
          id: item.id,
          name: item.name,
          phone: item.phone,
          service_name: (item.services as any)?.name || 'Atendimento WhatsApp',
          completed_at: item.created_at,
          attendant_id: item.attendant_id,
          type: 'whatsapp'
        });
      });

      // Filtrar serviços que já têm pesquisa respondida
      const servicesWithoutSurvey = [];
      for (const service of services) {
        const { data: existingSurvey } = await supabase
          .from('satisfaction_surveys')
          .select('id')
          .eq('attendant_id', service.attendant_id)
          .eq(service.type === 'queue' ? 'queue_customer_id' : 
              service.type === 'identity' ? 'identity_appointment_id' : 'whatsapp_service_id', 
              service.id)
          .maybeSingle();

        if (!existingSurvey) {
          servicesWithoutSurvey.push(service);
        }
      }

      // Ordenar por data de completamento (mais recente primeiro)
      servicesWithoutSurvey.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
      
      setCompletedServices(servicesWithoutSurvey);
    } catch (error) {
      console.error('Erro ao carregar serviços completados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os atendimentos disponíveis",
        variant: "destructive",
      });
    } finally {
      setLoadingServices(false);
    }
  };

  const handleServiceSelection = (service: CompletedService) => {
    setSelectedService(service);
    setShowServiceList(false);
  };

  const handleRemoveService = async (service: CompletedService, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Remover da lista local
    setCompletedServices(prevServices => 
      prevServices.filter(s => !(s.id === service.id && s.type === service.type))
    );
    
    toast({
      title: "Atendimento removido",
      description: "O atendimento foi removido da lista de pesquisas disponíveis",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!overallRating || !problemResolved || !improvementAspect) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, responda todas as perguntas",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      let surveyData: any = {
        overall_rating: overallRating,
        problem_resolved: problemResolved,
        improvement_aspect: improvementAspect,
      };

      // Se veio de link direto com parâmetros
      if (attendantId) {
        surveyData.attendant_id = attendantId;
        surveyData.queue_customer_id = queueCustomerId;
        surveyData.identity_appointment_id = identityAppointmentId;
        surveyData.whatsapp_service_id = whatsappServiceId;
      } 
      // Se veio da seleção de serviço
      else if (selectedService) {
        surveyData.attendant_id = selectedService.attendant_id;
        
        if (selectedService.type === 'queue') {
          surveyData.queue_customer_id = selectedService.id;
        } else if (selectedService.type === 'identity') {
          surveyData.identity_appointment_id = selectedService.id;
        } else if (selectedService.type === 'whatsapp') {
          surveyData.whatsapp_service_id = selectedService.id;
        }
      }

      const { error } = await supabase
        .from('satisfaction_surveys')
        .insert(surveyData);

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Pesquisa enviada!",
        description: "Obrigado pela sua avaliação!",
      });
      
    } catch (error: any) {
      toast({
        title: "Erro ao enviar pesquisa",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-8 text-center">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Pesquisa Enviada!</h2>
            <p className="text-muted-foreground mb-6">
              Obrigado por avaliar nosso atendimento. Sua opinião é muito importante para nós!
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Fechar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (linkExpired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-8 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Link Expirado</h2>
            <p className="text-muted-foreground mb-6">
              Esta pesquisa de satisfação já foi respondida anteriormente. 
              Cada link pode ser usado apenas uma vez.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Fechar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se deve mostrar a lista de serviços
  if (showServiceList) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-4xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Users className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Pesquisa de Satisfação</CardTitle>
            <p className="text-muted-foreground">
              Selecione o atendimento que você gostaria de avaliar
            </p>
          </CardHeader>
          
          <CardContent>
            {loadingServices ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">Carregando atendimentos...</p>
              </div>
            ) : completedServices.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum atendimento disponível</h3>
                <p className="text-muted-foreground mb-4">
                  Não há atendimentos recentes disponíveis para avaliação ou todas as pesquisas já foram respondidas.
                </p>
                <Button onClick={() => navigate('/')} variant="outline">
                  Voltar ao início
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Encontramos {completedServices.length} atendimento(s) de hoje disponível(is) para avaliação
                </p>
                
                <div className="grid gap-4">
                  {completedServices.map((service) => (
                    <Card 
                      key={`${service.type}-${service.id}`}
                      className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
                      onClick={() => handleServiceSelection(service)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                              {service.type === 'queue' ? (
                                <Users className="h-6 w-6 text-primary" />
                              ) : service.type === 'identity' ? (
                                <User className="h-6 w-6 text-primary" />
                              ) : (
                                <Clock className="h-6 w-6 text-primary" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold">{service.name}</h3>
                              <p className="text-sm text-muted-foreground">{service.service_name}</p>
                              <p className="text-xs text-muted-foreground">
                                Telefone: {service.phone}
                              </p>
                            </div>
                          </div>
                           <div className="text-right flex flex-col items-end space-y-2">
                             <div>
                               <p className="text-sm font-medium">
                                 {new Date(service.completed_at).toLocaleDateString('pt-BR')}
                               </p>
                               <p className="text-xs text-muted-foreground">
                                 {new Date(service.completed_at).toLocaleTimeString('pt-BR', { 
                                   hour: '2-digit', 
                                   minute: '2-digit' 
                                 })}
                               </p>
                             </div>
                             <div className="flex gap-2">
                               <Button 
                                 size="sm" 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleServiceSelection(service);
                                 }}
                               >
                                 Avaliar
                               </Button>
                               <Button 
                                 size="sm" 
                                 variant="outline"
                                 onClick={(e) => handleRemoveService(service, e)}
                                 className="text-muted-foreground hover:text-destructive"
                               >
                                 <X className="h-4 w-4" />
                               </Button>
                             </div>
                           </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="text-center pt-4">
                  <Button onClick={() => navigate('/')} variant="outline">
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Heart className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Pesquisa de Satisfação</CardTitle>
          <p className="text-muted-foreground">
            {selectedService ? 
              `Avaliando: ${selectedService.service_name} - ${selectedService.name}` :
              'Sua opinião é muito importante para melhorarmos nosso atendimento'
            }
          </p>
        </CardHeader>
        
        <CardContent>
          {selectedService && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Detalhes do Atendimento:</h3>
              <p className="text-sm text-muted-foreground">
                <strong>Serviço:</strong> {selectedService.service_name}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Data:</strong> {new Date(selectedService.completed_at).toLocaleString('pt-BR')}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setShowServiceList(true)}
              >
                Escolher outro atendimento
              </Button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Avaliação Geral */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">
                1. Como você avalia o atendimento de forma geral?
              </Label>
              <RadioGroup value={overallRating} onValueChange={setOverallRating}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Excelente" id="excellent" />
                  <Label htmlFor="excellent" className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    Excelente
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Bom" id="good" />
                  <Label htmlFor="good">Bom</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Regular" id="regular" />
                  <Label htmlFor="regular">Regular</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Ruim" id="bad" />
                  <Label htmlFor="bad">Ruim</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Péssimo" id="terrible" />
                  <Label htmlFor="terrible">Péssimo</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Resolução do Problema */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">
                2. Seu problema/solicitação foi resolvido?
              </Label>
              <RadioGroup value={problemResolved} onValueChange={setProblemResolved}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Sim" id="yes" />
                  <Label htmlFor="yes">Sim, completamente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Parcialmente" id="partially" />
                  <Label htmlFor="partially">Parcialmente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Não" id="no" />
                  <Label htmlFor="no">Não foi resolvido</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Aspecto de Melhoria */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">
                3. Qual aspecto mais precisa ser melhorado?
              </Label>
              <RadioGroup value={improvementAspect} onValueChange={setImprovementAspect}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Tempo de espera" id="wait-time" />
                  <Label htmlFor="wait-time">Tempo de espera</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Clareza das informações" id="information" />
                  <Label htmlFor="information">Clareza das informações</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Educação e cordialidade" id="politeness" />
                  <Label htmlFor="politeness">Educação e cordialidade</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Resolução do problema" id="resolution" />
                  <Label htmlFor="resolution">Resolução do problema</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Nenhuma melhoria necessária" id="none" />
                  <Label htmlFor="none">Nenhuma melhoria necessária</Label>
                </div>
              </RadioGroup>
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full"
              size="lg"
            >
              {loading ? 'Enviando...' : 'Enviar Pesquisa'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SatisfactionSurvey;
