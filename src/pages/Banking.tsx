import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ArrowUpRight, CreditCard, Wallet, Landmark, PiggyBank, Pencil, Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface BankAccount {
  id: string;
  account_name: string;
  account_type: string;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  opening_balance: number;
  current_balance: number;
  is_primary: boolean;
}

const ACCOUNT_TYPES = ["Savings", "Current", "Cash", "Credit Card", "Other"];

const Banking = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState({
    account_name: "",
    account_type: "Savings",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    opening_balance: 0,
    is_primary: false,
  });

  const fetchAccounts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .order("account_name");

    if (error) {
      toast.error("Failed to fetch bank accounts");
    } else {
      setAccounts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      account_name: formData.account_name,
      account_type: formData.account_type,
      bank_name: formData.bank_name || null,
      account_number: formData.account_number || null,
      ifsc_code: formData.ifsc_code || null,
      opening_balance: formData.opening_balance,
      current_balance: editingAccount ? editingAccount.current_balance : formData.opening_balance,
      is_primary: formData.is_primary,
    };

    if (editingAccount) {
      const { error } = await supabase
        .from("bank_accounts")
        .update(payload)
        .eq("id", editingAccount.id);
      if (error) {
        toast.error("Failed to update account");
      } else {
        toast.success("Account updated successfully");
        setOpenDialog(false);
        fetchAccounts();
      }
    } else {
      const { error } = await supabase.from("bank_accounts").insert(payload);
      if (error) {
        toast.error("Failed to create account");
      } else {
        toast.success("Account created successfully");
        setOpenDialog(false);
        fetchAccounts();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete account");
    } else {
      toast.success("Account deleted successfully");
      fetchAccounts();
    }
  };

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account);
    setFormData({
      account_name: account.account_name,
      account_type: account.account_type,
      bank_name: account.bank_name || "",
      account_number: account.account_number || "",
      ifsc_code: account.ifsc_code || "",
      opening_balance: account.opening_balance,
      is_primary: account.is_primary,
    });
    setOpenDialog(true);
  };

  const handleNewAccount = () => {
    setEditingAccount(null);
    setFormData({
      account_name: "",
      account_type: "Savings",
      bank_name: "",
      account_number: "",
      ifsc_code: "",
      opening_balance: 0,
      is_primary: false,
    });
    setOpenDialog(true);
  };

  // Calculate summary data
  const cashAccounts = accounts.filter((a) => a.account_type === "Cash");
  const bankAccounts = accounts.filter((a) => ["Savings", "Current"].includes(a.account_type));
  const creditCards = accounts.filter((a) => a.account_type === "Credit Card");

  const cashInHand = cashAccounts.reduce((sum, a) => sum + a.current_balance, 0);
  const bankBalance = bankAccounts.reduce((sum, a) => sum + a.current_balance, 0);
  const cardBalance = creditCards.reduce((sum, a) => sum + a.current_balance, 0);

  const columns: ColumnDef<BankAccount>[] = [
    {
      accessorKey: "account_name",
      header: "Account Details",
      cell: ({ row }) => {
        const account = row.original;
        const getIcon = () => {
          switch (account.account_type) {
            case "Savings":
            case "Current":
              return <Landmark className="h-4 w-4 text-books-blue" />;
            case "Cash":
              return <Wallet className="h-4 w-4 text-books-green" />;
            case "Credit Card":
              return <CreditCard className="h-4 w-4 text-books-yellow" />;
            default:
              return <PiggyBank className="h-4 w-4 text-muted-foreground" />;
          }
        };

        return (
          <div className="flex items-center gap-2">
            <div className="bg-muted w-8 h-8 rounded-full flex items-center justify-center">
              {getIcon()}
            </div>
            <div>
              <span className="font-medium">{account.account_name}</span>
              {account.bank_name && (
                <span className="text-sm text-muted-foreground ml-2">({account.bank_name})</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "account_type",
      header: "Type",
    },
    {
      accessorKey: "account_number",
      header: "Account Number",
      cell: ({ row }) => row.original.account_number || "—",
    },
    {
      accessorKey: "current_balance",
      header: "Balance",
      cell: ({ row }) => {
        const amount = row.original.current_balance;
        return (
          <div className={`font-medium ${amount < 0 ? "text-destructive" : ""}`}>
            {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount)}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row.original.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const topbarButtons = (
    <>
      <Button variant="outline" className="mr-2">
        Import Statement
      </Button>
      <Button className="bg-books-blue hover:bg-blue-700" onClick={handleNewAccount}>
        <Plus className="h-4 w-4 mr-1" /> Add Bank
      </Button>
    </>
  );

  return (
    <MainLayout title="Banking" searchPlaceholder="Search in Banking" topbarButtons={topbarButtons}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Banking Overview</h1>

        <Card className="border-l-4 border-l-books-blue bg-books-light-blue/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-white rounded-full p-2">
              <ArrowUpRight className="w-5 h-5 text-books-blue" />
            </div>
            <div>
              <h3 className="font-medium">Auto-upload bank statements from email</h3>
              <div className="flex items-center gap-6 mt-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-books-navy"></div>
                  <span>Enable Auto-upload</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-books-navy"></div>
                  <span>Set up Auto-forwarding</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-books-navy"></div>
                  <span>Add Statements to Bank</span>
                </div>
              </div>
            </div>
            <Button size="sm" className="ml-auto bg-books-blue hover:bg-blue-700">
              Set up Now
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="data-card">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-5 w-5 text-books-text" />
              <span className="font-medium text-sm text-books-text">Cash In Hand</span>
            </div>
            <div className={`text-xl font-bold ${cashInHand < 0 ? "text-destructive" : ""}`}>
              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(cashInHand)}
            </div>
          </div>

          <div className="data-card">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="h-5 w-5 text-books-text" />
              <span className="font-medium text-sm text-books-text">Total Accounts</span>
            </div>
            <div className="text-xl font-bold">{accounts.length}</div>
          </div>

          <div className="data-card">
            <div className="flex items-center gap-2 mb-2">
              <Landmark className="h-5 w-5 text-books-text" />
              <span className="font-medium text-sm text-books-text">Bank Balance</span>
            </div>
            <div className={`text-xl font-bold ${bankBalance < 0 ? "text-destructive" : ""}`}>
              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(bankBalance)}
            </div>
          </div>

          <div className="data-card">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-5 w-5 text-books-text" />
              <span className="font-medium text-sm text-books-text">Card Balance</span>
            </div>
            <div className={`text-xl font-bold ${cardBalance < 0 ? "text-destructive" : ""}`}>
              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(cardBalance)}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Active Accounts</h2>
          </div>

          <DataTable columns={columns} data={accounts} isLoading={loading} />
        </div>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingAccount ? "Edit Bank Account" : "Add Bank Account"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Account Name *</Label>
                  <Input
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Account Type</Label>
                  <Select
                    value={formData.account_type}
                    onValueChange={(v) => setFormData({ ...formData, account_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Bank Name</Label>
                  <Input
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label>IFSC Code</Label>
                  <Input
                    value={formData.ifsc_code}
                    onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Opening Balance</Label>
                  <Input
                    type="number"
                    value={formData.opening_balance}
                    onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_primary}
                    onCheckedChange={(v) => setFormData({ ...formData, is_primary: v })}
                  />
                  <Label>Primary Account</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-books-blue hover:bg-blue-700">
                  {editingAccount ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Banking;
