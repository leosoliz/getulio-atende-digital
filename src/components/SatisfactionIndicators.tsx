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
      <Card className="shadow-shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Satisfação do Atendimento
            {isUpdating && (
              <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">Nenhuma pesquisa respondida hoje</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Score Geral */}
      <Card className="shadow-shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            Score de Satisfação
            {isUpdating && (
              <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
            )}
          </CardTitle>
          <Heart className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${getSatisfactionColor(stats.satisfactionScore)}`}>
            {stats.satisfactionScore}%
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.totalSurveys} pesquisas hoje
          </p>
        </CardContent>
      </Card>

      {/* Avaliação Geral */}
      <Card className="shadow-shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <ThumbsUp className="h-4 w-4" />
            Avaliação Geral
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Excelente</span>
            <Badge variant="secondary" className="bg-success text-success-foreground">
              {getPercentage(stats.overallRating.excellent, stats.totalSurveys)}%
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Bom</span>
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
              {getPercentage(stats.overallRating.good, stats.totalSurveys)}%
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Regular</span>
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              {getPercentage(stats.overallRating.regular, stats.totalSurveys)}%
            </Badge>
          </div>
          {(stats.overallRating.poor > 0 || stats.overallRating.terrible > 0) && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm">Ruim</span>
                <Badge variant="destructive">
                  {getPercentage(stats.overallRating.poor, stats.totalSurveys)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Péssimo</span>
                <Badge variant="destructive">
                  {getPercentage(stats.overallRating.terrible, stats.totalSurveys)}%
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Resolução de Problemas */}
      <Card className="shadow-shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" />
            Resolução de Problemas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Sim</span>
            <Badge variant="secondary" className="bg-success text-success-foreground">
              {getPercentage(stats.problemResolved.yes, stats.totalSurveys)}%
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Parcialmente</span>
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              {getPercentage(stats.problemResolved.partially, stats.totalSurveys)}%
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Não</span>
            <Badge variant="destructive">
              {getPercentage(stats.problemResolved.no, stats.totalSurveys)}%
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SatisfactionIndicators;