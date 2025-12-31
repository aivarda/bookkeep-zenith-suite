import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Building2, CreditCard, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface BalanceSheetData {
  assets: {
    cash: number;
    bankAccounts: number;
    accountsReceivable: number;
    inventory: number;
    totalCurrent: number;
    totalAssets: number;
  };
  liabilities: {
    accountsPayable: number;
    vendorCredits: number;
    totalCurrent: number;
    totalLiabilities: number;
  };
  equity: {
    retainedEarnings: number;
    totalEquity: number;
  };
}

const BalanceSheet = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BalanceSheetData>({
    assets: {
      cash: 0,
      bankAccounts: 0,
      accountsReceivable: 0,
      inventory: 0,
      totalCurrent: 0,
      totalAssets: 0,
    },
    liabilities: {
      accountsPayable: 0,
      vendorCredits: 0,
      totalCurrent: 0,
      totalLiabilities: 0,
    },
    equity: {
      retainedEarnings: 0,
      totalEquity: 0,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Fetch bank accounts
        const { data: bankAccounts } = await supabase
          .from("bank_accounts")
          .select("current_balance, account_type");

        let cashBalance = 0;
        let bankBalance = 0;

        bankAccounts?.forEach((acc) => {
          if (acc.account_type === "Cash") {
            cashBalance += acc.current_balance;
          } else {
            bankBalance += acc.current_balance;
          }
        });

        // Fetch accounts receivable (unpaid invoices)
        const { data: invoices } = await supabase
          .from("invoices")
          .select("total_amount")
          .in("status", ["DRAFT", "SENT", "OVERDUE", "PENDING"]);

        const accountsReceivable = invoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;

        // Fetch inventory value
        const { data: inventoryData } = await supabase
          .from("inventory")
          .select("current_stock, item_id");

        const itemIds = inventoryData?.map((i) => i.item_id) || [];
        let inventoryValue = 0;

        if (itemIds.length > 0) {
          const { data: items } = await supabase
            .from("items")
            .select("id, rate")
            .in("id", itemIds);

          const itemRates: Record<string, number> = {};
          items?.forEach((item) => {
            itemRates[item.id] = item.rate;
          });

          inventoryData?.forEach((inv) => {
            inventoryValue += inv.current_stock * (itemRates[inv.item_id] || 0);
          });
        }

        // Fetch accounts payable (unpaid expenses)
        const { data: expenses } = await supabase
          .from("expenses")
          .select("total_amount")
          .in("status", ["DRAFT", "PENDING", "OVERDUE"]);

        const accountsPayable = expenses?.reduce((sum, exp) => sum + exp.total_amount, 0) || 0;

        // Fetch vendor credits
        const { data: vendorCredits } = await supabase
          .from("vendor_credits")
          .select("total_amount")
          .eq("status", "OPEN");

        const vendorCreditsTotal = vendorCredits?.reduce((sum, vc) => sum + vc.total_amount, 0) || 0;

        // Calculate totals
        const totalCurrentAssets = cashBalance + bankBalance + accountsReceivable + inventoryValue;
        const totalAssets = totalCurrentAssets;

        const totalCurrentLiabilities = accountsPayable + vendorCreditsTotal;
        const totalLiabilities = totalCurrentLiabilities;

        // Retained earnings = Assets - Liabilities (simplified)
        const retainedEarnings = totalAssets - totalLiabilities;
        const totalEquity = retainedEarnings;

        setData({
          assets: {
            cash: cashBalance,
            bankAccounts: bankBalance,
            accountsReceivable,
            inventory: inventoryValue,
            totalCurrent: totalCurrentAssets,
            totalAssets,
          },
          liabilities: {
            accountsPayable,
            vendorCredits: vendorCreditsTotal,
            totalCurrent: totalCurrentLiabilities,
            totalLiabilities,
          },
          equity: {
            retainedEarnings,
            totalEquity,
          },
        });
      } catch (error) {
        console.error("Error fetching balance sheet data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const asOfDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <MainLayout title="Balance Sheet" showSearch={false}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/reports")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Balance Sheet</h1>
              <p className="text-sm text-muted-foreground">As of {asOfDate}</p>
            </div>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="h-32 animate-pulse bg-muted" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assets */}
            <Card>
              <CardHeader className="bg-green-50 border-b">
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Building2 className="h-5 w-5" />
                  Assets
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3">Current Assets</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        Cash in Hand
                      </span>
                      <span className="font-medium">{formatCurrency(data.assets.cash)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        Bank Accounts
                      </span>
                      <span className="font-medium">{formatCurrency(data.assets.bankAccounts)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Accounts Receivable</span>
                      <span className="font-medium">{formatCurrency(data.assets.accountsReceivable)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Inventory</span>
                      <span className="font-medium">{formatCurrency(data.assets.inventory)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between py-2 mt-2 font-medium">
                    <span>Total Current Assets</span>
                    <span>{formatCurrency(data.assets.totalCurrent)}</span>
                  </div>
                </div>

                <div className="flex justify-between py-3 bg-green-50 px-3 rounded-lg font-bold text-green-700">
                  <span>Total Assets</span>
                  <span>{formatCurrency(data.assets.totalAssets)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Liabilities & Equity */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="bg-red-50 border-b">
                  <CardTitle className="text-red-700">Liabilities</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-3">Current Liabilities</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b">
                        <span>Accounts Payable</span>
                        <span className="font-medium">{formatCurrency(data.liabilities.accountsPayable)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Vendor Credits</span>
                        <span className="font-medium">{formatCurrency(data.liabilities.vendorCredits)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between py-2 mt-2 font-medium">
                      <span>Total Current Liabilities</span>
                      <span>{formatCurrency(data.liabilities.totalCurrent)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between py-3 bg-red-50 px-3 rounded-lg font-bold text-red-700">
                    <span>Total Liabilities</span>
                    <span>{formatCurrency(data.liabilities.totalLiabilities)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="bg-blue-50 border-b">
                  <CardTitle className="text-blue-700">Equity</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span>Retained Earnings</span>
                      <span className={`font-medium ${data.equity.retainedEarnings >= 0 ? "" : "text-red-600"}`}>
                        {formatCurrency(data.equity.retainedEarnings)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between py-3 bg-blue-50 px-3 rounded-lg font-bold text-blue-700">
                    <span>Total Equity</span>
                    <span>{formatCurrency(data.equity.totalEquity)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="flex justify-between py-3 font-bold text-lg">
                    <span>Total Liabilities + Equity</span>
                    <span>{formatCurrency(data.liabilities.totalLiabilities + data.equity.totalEquity)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default BalanceSheet;
