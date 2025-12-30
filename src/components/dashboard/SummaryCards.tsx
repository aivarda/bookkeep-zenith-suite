import { useState, useEffect } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  Users 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const SummaryCards = () => {
  const [data, setData] = useState({
    totalReceivables: 0,
    totalPayables: 0,
    bankBalance: 0,
    activeCustomers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      // Fetch unpaid invoices (receivables)
      const { data: invoices } = await supabase
        .from("invoices")
        .select("total_amount")
        .in("status", ["DRAFT", "SENT", "OVERDUE"]);

      const totalReceivables = invoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;

      // Fetch unpaid expenses (payables)
      const { data: expenses } = await supabase
        .from("expenses")
        .select("total_amount")
        .in("status", ["DRAFT", "PENDING", "OVERDUE"]);

      const totalPayables = expenses?.reduce((sum, exp) => sum + exp.total_amount, 0) || 0;

      // Fetch bank balance
      const { data: bankAccounts } = await supabase
        .from("bank_accounts")
        .select("current_balance")
        .in("account_type", ["Savings", "Current"]);

      const bankBalance = bankAccounts?.reduce((sum, acc) => sum + acc.current_balance, 0) || 0;

      // Fetch active customers count
      const { count: customerCount } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true });

      setData({
        totalReceivables,
        totalPayables,
        bankBalance,
        activeCustomers: customerCount || 0,
      });

      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Receivables"
        value={loading ? "Loading..." : formatCurrency(data.totalReceivables)}
        icon={<DollarSign className="h-5 w-5" />}
      />
      <StatCard
        title="Total Payables"
        value={loading ? "Loading..." : formatCurrency(data.totalPayables)}
        icon={<ArrowUpRight className="h-5 w-5" />}
      />
      <StatCard
        title="Bank Balance"
        value={loading ? "Loading..." : formatCurrency(data.bankBalance)}
        icon={<TrendingUp className="h-5 w-5" />}
      />
      <StatCard
        title="Active Customers"
        value={loading ? "..." : data.activeCustomers.toString()}
        icon={<Users className="h-5 w-5" />}
      />
    </div>
  );
};
