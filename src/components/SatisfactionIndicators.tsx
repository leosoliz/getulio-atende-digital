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
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-4 text-4xl font-bold">
          <Heart className="h-12 w-12 text-primary" />
          Satisfação do Atendimento
          {isUpdating && (
            <div className="h-6 w-6 bg-primary rounded-full animate-pulse"></div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Score de Satisfação */}
        <div className="text-center bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl p-6">
          <div className={`text-6xl font-black mb-2 ${getSatisfactionColor(stats.satisfactionScore)}`}>
            {stats.satisfactionScore}%
          </div>
          <p className="text-xl font-bold text-muted-foreground">
            Score Geral ({stats.totalSurveys} pesquisas)
          </p>
        </div>

        {/* Avaliação Geral e Resolução de Problemas lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Avaliação Geral */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-2xl font-bold">
              <ThumbsUp className="h-6 w-6" />
              Avaliação Geral
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">Excelente</span>
                <Badge variant="secondary" className="bg-success text-success-foreground text-xl py-2 px-3 font-black">
                  {getPercentage(stats.overallRating.excellent, stats.totalSurveys)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">Bom</span>
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground text-xl py-2 px-3 font-black">
                  {getPercentage(stats.overallRating.good, stats.totalSurveys)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">Regular</span>
                <Badge variant="secondary" className="bg-accent text-accent-foreground text-xl py-2 px-3 font-black">
                  {getPercentage(stats.overallRating.regular, stats.totalSurveys)}%
                </Badge>
              </div>
              {(stats.overallRating.poor > 0 || stats.overallRating.terrible > 0) && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">Ruim</span>
                    <Badge variant="destructive" className="text-xl py-2 px-3 font-black">
                      {getPercentage(stats.overallRating.poor, stats.totalSurveys)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">Péssimo</span>
                    <Badge variant="destructive" className="text-xl py-2 px-3 font-black">
                      {getPercentage(stats.overallRating.terrible, stats.totalSurveys)}%
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Resolução de Problemas */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-2xl font-bold">
              <TrendingUp className="h-6 w-6" />
              Resolução de Problemas
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">Sim</span>
                <Badge variant="secondary" className="bg-success text-success-foreground text-xl py-2 px-3 font-black">
                  {getPercentage(stats.problemResolved.yes, stats.totalSurveys)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">Parcialmente</span>
                <Badge variant="secondary" className="bg-accent text-accent-foreground text-xl py-2 px-3 font-black">
                  {getPercentage(stats.problemResolved.partially, stats.totalSurveys)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">Não</span>
                <Badge variant="destructive" className="text-xl py-2 px-3 font-black">
                  {getPercentage(stats.problemResolved.no, stats.totalSurveys)}%
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SatisfactionIndicators;