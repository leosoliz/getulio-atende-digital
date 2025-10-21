
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Edit2, Check, X } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: number;
  target?: number;
  icon: React.ReactNode;
  subtitle?: string;
  color: "blue" | "green" | "purple" | "orange";
  isEditable?: boolean;
  onTargetUpdate?: (newTarget: number) => void;
  isPercentage?: boolean;
}

export default function MetricsCard({ 
  title, 
  value, 
  target, 
  icon, 
  subtitle, 
  color,
  isEditable = false,
  onTargetUpdate,
  isPercentage = false
}: MetricsCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(target?.toString() || "");

  const colorClasses = {
    blue: "from-blue-500/10 to-blue-600/10 border-blue-200",
    green: "from-green-500/10 to-green-600/10 border-green-200", 
    purple: "from-purple-500/10 to-purple-600/10 border-purple-200",
    orange: "from-orange-500/10 to-orange-600/10 border-orange-200"
  };

  const iconColors = {
    blue: "text-blue-600",
    green: "text-green-600", 
    purple: "text-purple-600",
    orange: "text-orange-600"
  };

  const handleSave = () => {
    const newTarget = parseInt(editValue);
    if (!isNaN(newTarget) && onTargetUpdate) {
      onTargetUpdate(newTarget);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(target?.toString() || "");
    setIsEditing(false);
  };

  const percentage = target ? Math.round((value / target) * 100) : 0;

  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color]} border-2 hover:shadow-lg transition-all duration-300`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 pt-1 px-2">
        <CardTitle className="text-[10px] font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`h-5 w-5 ${iconColors[color]}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="pt-0.5 pb-1 px-2">
        <div className="text-xl font-bold text-foreground mb-0.5">
          {value.toLocaleString()}{isPercentage && '%'}
        </div>
        
        {target && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Meta:</span>
              {isEditable && !isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-5 px-1"
                >
                  <Edit2 className="h-2.5 w-2.5" />
                </Button>
              )}
            </div>
            
            {isEditing ? (
              <div className="flex items-center gap-0.5">
                <Input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="h-6 text-xs"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  className="h-6 w-6 p-0"
                >
                  <Check className="h-2.5 w-2.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{target.toLocaleString()}</span>
                  <Badge variant={percentage >= 100 ? "default" : "secondary"} className="text-[10px] h-4 px-1">
                    {percentage}%
                  </Badge>
                </div>
                <div className="w-full bg-secondary rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      percentage >= 100 ? "bg-green-500" : "bg-primary"
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </>
            )}
          </div>
        )}
        
        {subtitle && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
