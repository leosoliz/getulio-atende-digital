
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Star, CheckCircle, AlertCircle } from 'lucide-react';

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
  
  // Get parameters from URL
  const attendantId = searchParams.get('attendant_id');
  const queueCustomerId = searchParams.get('queue_customer_id');
  const identityAppointmentId = searchParams.get('identity_appointment_id');
  const whatsappServiceId = searchParams.get('whatsapp_service_id');

  useEffect(() => {
    const validateLink = async () => {
      // Se não há attendant_id, permite acesso mas não faz validações de duplicação
      if (!attendantId) {
        return;
      }

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

        const { data: existingSurvey, error } = await query.single();

        if (error && error.code !== 'PGRST116') {
          // Erro diferente de "não encontrado"
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
    };

    validateLink();
  }, [attendantId, queueCustomerId, identityAppointmentId, whatsappServiceId, toast]);

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

    // Se não há attendant_id, ainda permite enviar uma pesquisa genérica
    if (!attendantId) {
      toast({
        title: "Aviso",
        description: "Esta pesquisa será enviada sem vinculação a um atendente específico",
      });
    }
    
    setLoading(true);
    
    try {
      const surveyData = {
        attendant_id: attendantId || null, // Permite null se não houver attendant_id
        overall_rating: overallRating,
        problem_resolved: problemResolved,
        improvement_aspect: improvementAspect,
        queue_customer_id: queueCustomerId,
        identity_appointment_id: identityAppointmentId,
        whatsapp_service_id: whatsappServiceId
      };

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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Heart className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Pesquisa de Satisfação</CardTitle>
          <p className="text-muted-foreground">
            Sua opinião é muito importante para melhorarmos nosso atendimento
          </p>
        </CardHeader>
        
        <CardContent>
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
