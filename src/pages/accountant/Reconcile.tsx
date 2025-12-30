import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";

interface BankAccount {
  id: string;
  account_name: string;
  current_balance: number;
}

interface BankTransaction {
  id: string;
  date: string;
  type: string;
  description: string | null;
  amount: number;
  reference_number: string | null;
  is_reconciled: boolean;
}

const Reconcile = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchAccounts = async () => {
    const { data } = await supabase
      .from("bank_accounts")
      .select("id, account_name, current_balance")
      .order("account_name");
    setAccounts(data || []);
  };

  const fetchTransactions = async (accountId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bank_transactions")
      .select("*")
      .eq("bank_account_id", accountId)
      .order("date", { ascending: false });

    if (error) {
      toast.error("Failed to fetch transactions");
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchTransactions(selectedAccount);
      setSelectedIds(new Set());
    }
  }, [selectedAccount]);

  const handleToggleReconciled = async (id: string, currentValue: boolean) => {
    const { error } = await supabase
      .from("bank_transactions")
      .update({ is_reconciled: !currentValue })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update transaction");
    } else {
      toast.success(currentValue ? "Marked as unreconciled" : "Marked as reconciled");
      fetchTransactions(selectedAccount);
    }
  };

  const handleBulkReconcile = async () => {
    if (selectedIds.size === 0) {
      toast.error("Select transactions to reconcile");
      return;
    }

    const { error } = await supabase
      .from("bank_transactions")
      .update({ is_reconciled: true })
      .in("id", Array.from(selectedIds));

    if (error) {
      toast.error("Failed to reconcile transactions");
    } else {
      toast.success(`${selectedIds.size} transactions reconciled`);
      setSelectedIds(new Set());
      fetchTransactions(selectedAccount);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const unreconciledTransactions = transactions.filter((t) => !t.is_reconciled);
  const reconciledTransactions = transactions.filter((t) => t.is_reconciled);

  const totalUnreconciled = unreconciledTransactions.reduce(
    (sum, t) => sum + (t.type === "credit" ? t.amount : -t.amount),
    0
  );

  const columns: ColumnDef<BankTransaction>[] = [
    {
      id: "select",
      cell: ({ row }) =>
        !row.original.is_reconciled && (
          <Checkbox
            checked={selectedIds.has(row.original.id)}
            onCheckedChange={() => toggleSelection(row.original.id)}
          />
        ),
    },
    { accessorKey: "date", header: "Date" },
    { accessorKey: "type", header: "Type", cell: ({ row }) => (
      <span className={row.original.type === "credit" ? "text-green-600" : "text-red-600"}>
        {row.original.type.toUpperCase()}
      </span>
    )},
    { accessorKey: "description", header: "Description", cell: ({ row }) => row.original.description || "—" },
    { accessorKey: "reference_number", header: "Reference", cell: ({ row }) => row.original.reference_number || "—" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className={row.original.type === "credit" ? "text-green-600" : "text-red-600"}>
          {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(row.original.amount)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        row.original.is_reconciled ? (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" /> Reconciled
          </span>
        ) : (
          <span className="flex items-center gap-1 text-muted-foreground">
            <XCircle className="h-4 w-4" /> Pending
          </span>
        )
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleToggleReconciled(row.original.id, row.original.is_reconciled)}
        >
          {row.original.is_reconciled ? "Undo" : "Reconcile"}
        </Button>
      ),
    },
  ];

  const selectedAccount_ = accounts.find((a) => a.id === selectedAccount);

  const topbarButtons = (
    <Button
      className="bg-books-blue hover:bg-blue-700"
      onClick={handleBulkReconcile}
      disabled={selectedIds.size === 0}
    >
      <CheckCircle className="h-4 w-4 mr-1" /> Reconcile Selected ({selectedIds.size})
    </Button>
  );

  return (
    <MainLayout
      title="Reconcile"
      searchPlaceholder="Search reconciliations"
      topbarButtons={selectedAccount ? topbarButtons : undefined}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 text-books-blue" />
          <h1 className="text-2xl font-bold">Account Reconciliation</h1>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Select Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="w-64">
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedAccount_ && (
                <div className="text-sm text-muted-foreground">
                  Current Balance:{" "}
                  <span className="font-semibold text-foreground">
                    {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
                      selectedAccount_.current_balance
                    )}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedAccount && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-amber-500" />
                    <span className="text-sm text-muted-foreground">Unreconciled</span>
                  </div>
                  <div className="text-2xl font-bold">{unreconciledTransactions.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-muted-foreground">Reconciled</span>
                  </div>
                  <div className="text-2xl font-bold">{reconciledTransactions.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="h-5 w-5 text-books-blue" />
                    <span className="text-sm text-muted-foreground">Difference</span>
                  </div>
                  <div className={`text-2xl font-bold ${totalUnreconciled >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(totalUnreconciled)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable columns={columns} data={transactions} isLoading={loading} />
              </CardContent>
            </Card>
          </>
        )}

        {!selectedAccount && (
          <Card>
            <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
              Select a bank account to start reconciliation
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default Reconcile;
