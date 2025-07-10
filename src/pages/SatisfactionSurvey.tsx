import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface CompletedService {
  id: string;
  name: string;
  phone: string;
  queue_number: number;
  completed_at: string;
  attendant_id: string;
  service_id: string;
  has_survey: boolean;
}

interface Service {
  id: string;
  name: string;
}

export default function SatisfactionSurvey() {
  const [completedServices, setCompletedServices] = useState<CompletedService[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<CompletedService | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [overallRating, setOverallRating] = useState("");
  const [problemResolved, setProblemResolved] = useState("");
  const [improvementAspect, setImprovementAspect] = useState("");
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch services
      const { data: servicesData } = await supabase
        .from('services')
        .select('id, name');
      
      if (servicesData) {
        setServices(servicesData);
      }

      // Fetch completed queue customers with surveys info
      const { data: queueData } = await supabase
        .from('queue_customers')
        .select(`
          id,
          name,
          phone,
          queue_number,
          completed_at,
          attendant_id,
          service_id
        `)
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      if (queueData) {
        // Check which customers already have surveys
        const customerIds = queueData.map(customer => customer.id);
        const { data: surveysData } = await supabase
          .from('satisfaction_surveys')
          .select('queue_customer_id')
          .in('queue_customer_id', customerIds);

        const surveysSet = new Set(surveysData?.map(s => s.queue_customer_id) || []);
        
        const completedWithSurveys = queueData.map(customer => ({
          ...customer,
          has_survey: surveysSet.has(customer.id)
        }));

        setCompletedServices(completedWithSurveys);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openSurveyDialog = (service: CompletedService) => {
    setSelectedService(service);
    setOverallRating("");
    setProblemResolved("");
    setImprovementAspect("");
    setIsDialogOpen(true);
  };

  const handleSubmitSurvey = async () => {
    if (!selectedService || !overallRating || !problemResolved || !improvementAspect) {
      toast({
        title: "Erro",
        description: "Por favor, responda todas as perguntas",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const { error } = await supabase
        .from('satisfaction_surveys')
        .insert({
          queue_customer_id: selectedService.id,
          attendant_id: selectedService.attendant_id,
          overall_rating: overallRating,
          problem_resolved: problemResolved,
          improvement_aspect: improvementAspect
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Pesquisa de satisfação registrada com sucesso!",
      });

      setIsDialogOpen(false);
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar pesquisa de satisfação",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelSurvey = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('satisfaction_surveys')
        .delete()
        .eq('queue_customer_id', serviceId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Pesquisa de satisfação cancelada",
      });

      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error canceling survey:', error);
      toast({
        title: "Erro",
        description: "Erro ao cancelar pesquisa de satisfação",
        variant: "destructive",
      });
    }
  };

  const getServiceName = (serviceId: string) => {
    return services.find(s => s.id === serviceId)?.name || "Serviço não encontrado";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando atendimentos...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Pesquisa de Satisfação</h1>
        <p className="text-muted-foreground">
          Gerencie as pesquisas de satisfação dos atendimentos realizados
        </p>
      </div>

      <div className="grid gap-4">
        {completedServices.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">
                Nenhum atendimento finalizado encontrado
              </p>
            </CardContent>
          </Card>
        ) : (
          completedServices.map((service) => (
            <Card key={service.id} className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <span className="text-lg">Cidadão: {service.name}</span>
                    <div className="text-sm text-muted-foreground">
                      Senha: {service.queue_number} | Telefone: {service.phone}
                    </div>
                  </div>
                  {service.has_survey ? (
                    <CheckCircle className="h-6 w-6 text-success" />
                  ) : (
                    <XCircle className="h-6 w-6 text-muted-foreground" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <p><strong>Serviço:</strong> {getServiceName(service.service_id)}</p>
                  <p><strong>Finalizado em:</strong> {format(new Date(service.completed_at), 'dd/MM/yyyy HH:mm')}</p>
                  <p><strong>Status da Pesquisa:</strong> {service.has_survey ? "Realizada" : "Pendente"}</p>
                </div>
                
                <div className="flex gap-2">
                  {!service.has_survey ? (
                    <Button 
                      onClick={() => openSurveyDialog(service)}
                      className="flex-1"
                    >
                      Realizar Pesquisa
                    </Button>
                  ) : (
                    <Button 
                      variant="destructive" 
                      onClick={() => cancelSurvey(service.id)}
                      className="flex-1"
                    >
                      Cancelar Pesquisa
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pesquisa de Satisfação</DialogTitle>
          </DialogHeader>
          
          {selectedService && (
            <div className="space-y-6">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Atendimento</h3>
                <p><strong>Cidadão:</strong> {selectedService.name}</p>
                <p><strong>Serviço:</strong> {getServiceName(selectedService.service_id)}</p>
                <p><strong>Finalizado:</strong> {format(new Date(selectedService.completed_at), 'dd/MM/yyyy HH:mm')}</p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-base font-medium mb-4 block">
                    1. Como você avalia o atendimento recebido hoje?
                  </Label>
                  <RadioGroup value={overallRating} onValueChange={setOverallRating}>
                    {['Excelente', 'Bom', 'Regular', 'Ruim', 'Péssimo'].map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`rating-${option}`} />
                        <Label htmlFor={`rating-${option}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base font-medium mb-4 block">
                    2. O seu problema ou solicitação foi resolvido?
                  </Label>
                  <RadioGroup value={problemResolved} onValueChange={setProblemResolved}>
                    {['Sim', 'Parcialmente', 'Não'].map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`resolved-${option}`} />
                        <Label htmlFor={`resolved-${option}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base font-medium mb-4 block">
                    3. Em qual aspecto o atendimento poderia melhorar?
                  </Label>
                  <RadioGroup value={improvementAspect} onValueChange={setImprovementAspect}>
                    {[
                      'Tempo de espera',
                      'Clareza das informações',
                      'Educação e cordialidade',
                      'Resolução do problema',
                      'Nenhuma melhoria necessária'
                    ].map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`improvement-${option}`} />
                        <Label htmlFor={`improvement-${option}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSubmitSurvey} 
                  disabled={submitting || !overallRating || !problemResolved || !improvementAspect}
                  className="flex-1"
                >
                  {submitting ? "Salvando..." : "Salvar Pesquisa"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}