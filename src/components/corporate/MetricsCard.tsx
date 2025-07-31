
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
}

export default function MetricsCard({ 
  title, 
  value, 
  target, 
  icon, 
  subtitle, 
  color,
  isEditable = false,
  onTargetUpdate 
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`h-8 w-8 ${iconColors[color]}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground mb-2">
          {value.toLocaleString()}
        </div>
        
        {target && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Meta:</span>
              {isEditable && !isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-6 px-2"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {isEditing ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="h-7 text-sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  className="h-7 w-7 p-0"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="h-7 w-7 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{target.toLocaleString()}</span>
                  <Badge variant={percentage >= 100 ? "default" : "secondary"}>
                    {percentage}%
                  </Badge>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
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
          <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
