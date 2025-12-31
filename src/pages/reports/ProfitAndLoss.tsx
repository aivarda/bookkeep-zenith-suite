import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, TrendingUp, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PnLData {
  income: {
    sales: number;
    otherIncome: number;
    total: number;
  };
  expenses: {
    costOfGoods: number;
    operatingExpenses: number;
    total: number;
  };
  grossProfit: number;
  netProfit: number;
}

const ProfitAndLoss = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("this-month");
  const [data, setData] = useState<PnLData>({
    income: { sales: 0, otherIncome: 0, total: 0 },
    expenses: { costOfGoods: 0, operatingExpenses: 0, total: 0 },
    grossProfit: 0,
    netProfit: 0,
  });

  const getDateRange = (periodValue: string) => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (periodValue) {
      case "this-month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "last-month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "this-quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case "this-year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "last-year":
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { startDate, endDate } = getDateRange(period);

      try {
        // Fetch paid invoices (Sales Income)
        const { data: invoices } = await supabase
          .from("invoices")
          .select("total_amount")
          .eq("status", "PAID")
          .gte("date_issued", startDate)
          .lte("date_issued", endDate);

        const salesIncome = invoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;

        // Fetch payments received (for other income calculation)
        const { data: payments } = await supabase
          .from("payments_received")
          .select("amount")
          .gte("date", startDate)
          .lte("date", endDate);

        const paymentsTotal = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const otherIncome = Math.max(0, paymentsTotal - salesIncome);

        // Fetch paid expenses
        const { data: expenses } = await supabase
          .from("expenses")
          .select("total_amount, category")
          .eq("status", "PAID")
          .gte("date", startDate)
          .lte("date", endDate);

        let costOfGoods = 0;
        let operatingExpenses = 0;

        expenses?.forEach((exp) => {
          if (exp.category?.toLowerCase().includes("cost") || exp.category?.toLowerCase().includes("goods")) {
            costOfGoods += exp.total_amount;
          } else {
            operatingExpenses += exp.total_amount;
          }
        });

        const totalExpenses = costOfGoods + operatingExpenses;
        const totalIncome = salesIncome + otherIncome;
        const grossProfit = salesIncome - costOfGoods;
        const netProfit = totalIncome - totalExpenses;

        setData({
          income: {
            sales: salesIncome,
            otherIncome,
            total: totalIncome,
          },
          expenses: {
            costOfGoods,
            operatingExpenses,
            total: totalExpenses,
          },
          grossProfit,
          netProfit,
        });
      } catch (error) {
        console.error("Error fetching P&L data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPeriodLabel = () => {
    const { startDate, endDate } = getDateRange(period);
    return `${new Date(startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} - ${new Date(endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
  };

  return (
    <MainLayout title="Profit & Loss" showSearch={false}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/reports")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Profit & Loss Statement</h1>
              <p className="text-sm text-muted-foreground">{getPeriodLabel()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="this-quarter">This Quarter</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
                <SelectItem value="last-year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="h-24 animate-pulse bg-muted" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Total Income</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(data.income.total)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Total Expenses</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(data.expenses.total)}
                  </p>
                </CardContent>
              </Card>
              <Card className={data.netProfit >= 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <CardContent className="pt-6">
                  <div className="text-muted-foreground mb-2">
                    <span className="text-sm">Net Profit</span>
                  </div>
                  <p className={`text-2xl font-bold ${data.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(data.netProfit)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Statement */}
            <Card>
              <CardHeader>
                <CardTitle>Income</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Sales Revenue</span>
                  <span className="font-medium">{formatCurrency(data.income.sales)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Other Income</span>
                  <span className="font-medium">{formatCurrency(data.income.otherIncome)}</span>
                </div>
                <div className="flex justify-between py-2 font-semibold text-green-600">
                  <span>Total Income</span>
                  <span>{formatCurrency(data.income.total)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expenses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Cost of Goods Sold</span>
                  <span className="font-medium">{formatCurrency(data.expenses.costOfGoods)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Operating Expenses</span>
                  <span className="font-medium">{formatCurrency(data.expenses.operatingExpenses)}</span>
                </div>
                <div className="flex justify-between py-2 font-semibold text-red-600">
                  <span>Total Expenses</span>
                  <span>{formatCurrency(data.expenses.total)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Gross Profit</span>
                  <span className={`font-semibold ${data.grossProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(data.grossProfit)}
                  </span>
                </div>
                <div className="flex justify-between py-3 bg-muted/50 px-3 rounded-lg">
                  <span className="text-lg font-bold">Net Profit / (Loss)</span>
                  <span className={`text-lg font-bold ${data.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(data.netProfit)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ProfitAndLoss;
