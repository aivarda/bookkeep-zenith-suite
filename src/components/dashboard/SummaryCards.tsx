
import { StatCard } from "@/components/ui/stat-card";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpRight, 
  Calendar, 
  Users 
} from "lucide-react";

export const SummaryCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Receivables"
        value="₹10,500.00"
        icon={<DollarSign className="h-5 w-5" />}
      />
      <StatCard
        title="Total Payables"
        value="₹0.00"
        icon={<ArrowUpRight className="h-5 w-5" />}
      />
      <StatCard
        title="Bank Balance"
        value="₹3,56,767.02"
        trend={{
          value: 12,
          label: "vs last month",
          isPositive: true
        }}
        icon={<TrendingUp className="h-5 w-5" />}
      />
      <StatCard
        title="Active Customers"
        value="24"
        icon={<Users className="h-5 w-5" />}
      />
    </div>
  );
};
