
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard = ({
  title,
  value,
  icon,
  trend,
  className,
}: StatCardProps) => {
  return (
    <div className={cn("stats-card", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className="flex items-center mt-1 text-xs">
            <span
              className={
                trend.isPositive ? "text-books-green" : "text-books-red"
              }
            >
              {trend.isPositive ? "+" : "-"}
              {trend.value}%
            </span>
            <span className="ml-1 text-gray-500">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
};
