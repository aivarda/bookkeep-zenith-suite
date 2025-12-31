import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, AlertCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

interface AgingInvoice {
  id: string;
  invoice_number: string;
  client_name: string;
  date_issued: string;
  due_date: string;
  total_amount: number;
  days_overdue: number;
  aging_bucket: string;
}

interface AgingSummary {
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  over90: number;
  total: number;
}

const ReceivablesAging = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<AgingInvoice[]>([]);
  const [summary, setSummary] = useState<AgingSummary>({
    current: 0,
    days1to30: 0,
    days31to60: 0,
    days61to90: 0,
    over90: 0,
    total: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Fetch unpaid invoices
        const { data: invoicesData } = await supabase
          .from("invoices")
          .select("id, invoice_number, client_id, date_issued, due_date, total_amount")
          .in("status", ["DRAFT", "SENT", "OVERDUE", "PENDING"])
          .order("due_date", { ascending: true });

        if (!invoicesData || invoicesData.length === 0) {
          setInvoices([]);
          setLoading(false);
          return;
        }

        // Fetch client names
        const clientIds = invoicesData
          .map((inv) => inv.client_id)
          .filter((id) => id !== null) as string[];

        let clientLookup: Record<string, string> = {};
        if (clientIds.length > 0) {
          const { data: clients } = await supabase
            .from("clients")
            .select("id, name")
            .in("id", clientIds);

          clients?.forEach((c) => {
            clientLookup[c.id] = c.name;
          });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let currentTotal = 0;
        let days1to30Total = 0;
        let days31to60Total = 0;
        let days61to90Total = 0;
        let over90Total = 0;

        const processedInvoices: AgingInvoice[] = invoicesData.map((inv) => {
          const dueDate = new Date(inv.due_date);
          dueDate.setHours(0, 0, 0, 0);
          
          const diffTime = today.getTime() - dueDate.getTime();
          const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          let agingBucket: string;
          if (daysOverdue <= 0) {
            agingBucket = "Current";
            currentTotal += inv.total_amount;
          } else if (daysOverdue <= 30) {
            agingBucket = "1-30 Days";
            days1to30Total += inv.total_amount;
          } else if (daysOverdue <= 60) {
            agingBucket = "31-60 Days";
            days31to60Total += inv.total_amount;
          } else if (daysOverdue <= 90) {
            agingBucket = "61-90 Days";
            days61to90Total += inv.total_amount;
          } else {
            agingBucket = "Over 90 Days";
            over90Total += inv.total_amount;
          }

          return {
            id: inv.id,
            invoice_number: inv.invoice_number,
            client_name: inv.client_id ? clientLookup[inv.client_id] || "Unknown" : "No Client",
            date_issued: inv.date_issued,
            due_date: inv.due_date,
            total_amount: inv.total_amount,
            days_overdue: Math.max(0, daysOverdue),
            aging_bucket: agingBucket,
          };
        });

        setInvoices(processedInvoices);
        setSummary({
          current: currentTotal,
          days1to30: days1to30Total,
          days31to60: days31to60Total,
          days61to90: days61to90Total,
          over90: over90Total,
          total: currentTotal + days1to30Total + days31to60Total + days61to90Total + over90Total,
        });
      } catch (error) {
        console.error("Error fetching aging data:", error);
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

  const getBucketBadgeVariant = (bucket: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (bucket) {
      case "Current":
        return "secondary";
      case "1-30 Days":
        return "outline";
      case "31-60 Days":
        return "default";
      case "61-90 Days":
        return "destructive";
      case "Over 90 Days":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const columns: ColumnDef<AgingInvoice>[] = [
    {
      accessorKey: "invoice_number",
      header: "Invoice#",
      cell: ({ row }) => (
        <span className="text-books-blue font-medium">{row.getValue("invoice_number")}</span>
      ),
    },
    {
      accessorKey: "client_name",
      header: "Customer",
    },
    {
      accessorKey: "date_issued",
      header: "Invoice Date",
      cell: ({ row }) => new Date(row.getValue("date_issued")).toLocaleDateString(),
    },
    {
      accessorKey: "due_date",
      header: "Due Date",
      cell: ({ row }) => new Date(row.getValue("due_date")).toLocaleDateString(),
    },
    {
      accessorKey: "days_overdue",
      header: "Days Overdue",
      cell: ({ row }) => {
        const days = row.getValue("days_overdue") as number;
        return days > 0 ? (
          <span className="text-red-600 font-medium">{days} days</span>
        ) : (
          <span className="text-green-600">On time</span>
        );
      },
    },
    {
      accessorKey: "aging_bucket",
      header: "Aging Bucket",
      cell: ({ row }) => (
        <Badge variant={getBucketBadgeVariant(row.getValue("aging_bucket"))}>
          {row.getValue("aging_bucket")}
        </Badge>
      ),
    },
    {
      accessorKey: "total_amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-medium">{formatCurrency(row.getValue("total_amount"))}</span>
      ),
    },
  ];

  const asOfDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <MainLayout title="Receivables Aging" showSearch={false}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/reports")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Accounts Receivable Aging</h1>
              <p className="text-sm text-muted-foreground">As of {asOfDate}</p>
            </div>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Current</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(summary.current)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">1-30 Days</p>
              <p className="text-lg font-bold text-yellow-600">{formatCurrency(summary.days1to30)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">31-60 Days</p>
              <p className="text-lg font-bold text-orange-600">{formatCurrency(summary.days31to60)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">61-90 Days</p>
              <p className="text-lg font-bold text-red-500">{formatCurrency(summary.days61to90)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Over 90 Days</p>
              <p className="text-lg font-bold text-red-700">{formatCurrency(summary.over90)}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Total Outstanding</p>
              <p className="text-lg font-bold">{formatCurrency(summary.total)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Warning for overdue */}
        {summary.over90 > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-700">Critical Overdue Amount</p>
                <p className="text-sm text-red-600">
                  {formatCurrency(summary.over90)} is overdue by more than 90 days
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Outstanding Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={invoices} isLoading={loading} />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ReceivablesAging;
