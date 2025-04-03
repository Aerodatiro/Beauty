import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  isLoading?: boolean;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  isLoading = false
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-neutral-500">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <h3 className="text-2xl font-bold text-neutral-800 mt-1">{value}</h3>
            )}
            <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-full text-primary">
            {icon}
          </div>
        </div>
        
        {trend && (
          <div className="mt-4 pt-4 border-t border-neutral-100">
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <p className="text-sm flex items-center">
                <span className={`mr-1 ${trend.value >= 0 ? 'text-success' : 'text-warning'}`}>
                  {trend.value >= 0 ? (
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="inline h-3 w-3 mr-1" />
                  )}
                  {Math.abs(trend.value)}%
                </span>
                <span className="text-neutral-500">{trend.label}</span>
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
