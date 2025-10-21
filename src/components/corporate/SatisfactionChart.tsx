
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface SatisfactionChartProps {
  averageRating: number;
  totalSurveys: number;
  ratingDistribution: { [key: string]: number };
}

export default function SatisfactionChart({ 
  averageRating, 
  totalSurveys, 
  ratingDistribution 
}: SatisfactionChartProps) {
  return (
    <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50/50 to-yellow-100/50">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Star className="h-4 w-4 text-yellow-600" />
          Satisfação Geral
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="space-y-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-0.5">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(averageRating) 
                        ? "text-yellow-400 fill-current" 
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <Badge variant="outline" className="text-xs">
                {totalSurveys} avaliações
              </Badge>
            </div>
            
            <div className="space-y-1.5">
              {Object.entries(ratingDistribution).map(([rating, count]) => {
                const percentage = totalSurveys > 0 ? (count / totalSurveys) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center justify-between text-sm">
                    <span className="capitalize min-w-0 flex-1">{rating}</span>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-16 bg-secondary rounded-full h-2">
                        <div
                          className="h-2 bg-yellow-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground min-w-fit">
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
