import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Heart, ThumbsUp, TrendingUp } from 'lucide-react';

interface SatisfactionData {
  overall_rating: string;
  problem_resolved: string;
  improvement_aspect: string;
}

interface SatisfactionStats {
  totalSurveys: number;
  overallRating: {
    excellent: number;
    good: number;
    regular: number;
    poor: number;
    terrible: number;
  };
  problemResolved: {
    yes: number;
    partially: number;
    no: number;
  };
  improvementAspect: {
    waitTime: number;
    information: number;
    politeness: number;
    resolution: number;
    none: number;
  };
  satisfactionScore: number;
}

const SatisfactionIndicators: React.FC = () => {
  const [stats, setStats] = useState<SatisfactionStats>({
    totalSurveys: 0,
    overallRating: { excellent: 0, good: 0, regular: 0, poor: 0, terrible: 0 },
    problemResolved: { yes: 0, partially: 0, no: 0 },
    improvementAspect: { waitTime: 0, information: 0, politeness: 0, resolution: 0, none: 0 },
    satisfactionScore: 0,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchSatisfactionData();
    
    // Configurar real-time para atualizações da tabela satisfaction_surveys
    const channel = supabase
      .channel('satisfaction-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'satisfaction_surveys' },
        (payload) => {
          console.log('Satisfaction survey changed:', payload);
          setIsUpdating(true);
          fetchSatisfactionData(); // Refetch data quando há mudanças
        }
      )
      .subscribe();

    // Atualizar a cada 30 segundos como fallback
    const interval = setInterval(fetchSatisfactionData, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const fetchSatisfactionData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: surveys } = await supabase
        .from('satisfaction_surveys')
        .select('overall_rating, problem_resolved, improvement_aspect')
        .gte('created_at', `${today}T00:00:00`);

      if (!surveys || surveys.length === 0) {
        setStats({
          totalSurveys: 0,
          overallRating: { excellent: 0, good: 0, regular: 0, poor: 0, terrible: 0 },
          problemResolved: { yes: 0, partially: 0, no: 0 },
          improvementAspect: { waitTime: 0, information: 0, politeness: 0, resolution: 0, none: 0 },
          satisfactionScore: 0,
        });
        return;
      }

      const totalSurveys = surveys.length;

      // Calcular estatísticas de avaliação geral
      const overallRating = {
        excellent: surveys.filter(s => s.overall_rating === 'Excelente').length,
        good: surveys.filter(s => s.overall_rating === 'Bom').length,
        regular: surveys.filter(s => s.overall_rating === 'Regular').length,
        poor: surveys.filter(s => s.overall_rating === 'Ruim').length,
        terrible: surveys.filter(s => s.overall_rating === 'Péssimo').length,
      };

      // Calcular estatísticas de resolução de problema
      const problemResolved = {
        yes: surveys.filter(s => s.problem_resolved === 'Sim').length,
        partially: surveys.filter(s => s.problem_resolved === 'Parcialmente').length,
        no: surveys.filter(s => s.problem_resolved === 'Não').length,
      };

      // Calcular estatísticas de melhoria
      const improvementAspect = {
        waitTime: surveys.filter(s => s.improvement_aspect === 'Tempo de espera').length,
        information: surveys.filter(s => s.improvement_aspect === 'Clareza das informações').length,
        politeness: surveys.filter(s => s.improvement_aspect === 'Educação e cordialidade').length,
        resolution: surveys.filter(s => s.improvement_aspect === 'Resolução do problema').length,
        none: surveys.filter(s => s.improvement_aspect === 'Nenhuma melhoria necessária').length,
      };

      // Calcular score de satisfação (0-100)
      const satisfactionScore = Math.round(
        ((overallRating.excellent * 5 + overallRating.good * 4 + overallRating.regular * 3 + overallRating.poor * 2 + overallRating.terrible * 1) / (totalSurveys * 5)) * 100
      );

      setStats({
        totalSurveys,
        overallRating,
        problemResolved,
        improvementAspect,
        satisfactionScore,
      });
      
      // Remover indicador de atualização após um delay
      setTimeout(() => setIsUpdating(false), 1000);
    } catch (error) {
      console.error('Erro ao buscar dados de satisfação:', error);
      setIsUpdating(false);
    }
  };

  const getPercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  const getSatisfactionColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-secondary';
    if (score >= 40) return 'text-accent';
    return 'text-destructive';
  };

  if (stats.totalSurveys === 0) {
    return (
      <Card className="shadow-shadow-card border-2">
        <CardHeader className="pb-8">
          <CardTitle className="flex items-center gap-4 text-4xl font-bold">
            <Heart className="h-10 w-10" />
            Satisfação do Atendimento
            {isUpdating && (
              <div className="h-4 w-4 bg-primary rounded-full animate-pulse"></div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-2xl text-muted-foreground font-bold">Nenhuma pesquisa respondida hoje</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-shadow-card border-2 hover:shadow-shadow-elevated transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-3xl font-bold flex items-center gap-3">
          Score de Satisfação
          {isUpdating && (
            <div className="h-4 w-4 bg-primary rounded-full animate-pulse"></div>
          )}
        </CardTitle>
        <Heart className="h-10 w-10 text-primary" />
      </CardHeader>
      <CardContent>
        <div className={`text-8xl font-black mb-4 ${getSatisfactionColor(stats.satisfactionScore)}`}>
          {stats.satisfactionScore}%
        </div>
        <p className="text-2xl text-muted-foreground font-bold">
          {stats.totalSurveys} pesquisas hoje
        </p>
      </CardContent>
    </Card>
  );
};

export default SatisfactionIndicators;