
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

interface ChartAccount {
  id: string;
  account_name: string;
  account_type: string;
  account_code: string | null;
  description: string | null;
  status: string;
}

const ACCOUNT_TYPES = [
  "Asset",
  "Liability",
  "Equity",
  "Income",
  "Expense",
  "Other Current Asset",
  "Fixed Asset",
  "Other Asset",
  "Cash",
  "Bank",
  "Accounts Receivable",
  "Accounts Payable",
  "Credit Card",
  "Other Current Liability",
  "Long Term Liability",
];

const ChartOfAccounts = () => {
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartAccount | null>(null);
  
  const [formData, setFormData] = useState({
    account_name: "",
    account_type: "",
    account_code: "",
    description: "",
    status: "Active",
  });

  // Fetch accounts from Supabase
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .order("account_name");
        
      if (error) throw error;
      
      setAccounts(data || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Could not load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleStatusChange = (checked: boolean) => {
    setFormData({ ...formData, status: checked ? "Active" : "Inactive" });
  };

  const resetForm = () => {
    setFormData({
      account_name: "",
      account_type: "",
      account_code: "",
      description: "",
      status: "Active",
    });
    setEditingAccount(null);
  };

  const handleEditAccount = (account: ChartAccount) => {
    setEditingAccount(account);
    setFormData({
      account_name: account.account_name,
      account_type: account.account_type,
      account_code: account.account_code || "",
      description: account.description || "",
      status: account.status,
    });
    setOpenDialog(true);
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from("chart_of_accounts")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      toast.success("Account deleted successfully");
      fetchAccounts();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Could not delete the account");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAccount) {
        // Update existing account
        const { error } = await supabase
          .from("chart_of_accounts")
          .update({
            account_name: formData.account_name,
            account_type: formData.account_type,
            account_code: formData.account_code || null,
            description: formData.description || null,
            status: formData.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingAccount.id);
          
        if (error) throw error;
        
        toast.success("Account updated successfully");
      } else {
        // Create new account
        const { error } = await supabase
          .from("chart_of_accounts")
          .insert({
            account_name: formData.account_name,
            account_type: formData.account_type,
            account_code: formData.account_code || null,
            description: formData.description || null,
            status: formData.status,
          });
          
        if (error) throw error;
        
        toast.success("Account created successfully");
      }
      
      setOpenDialog(false);
      resetForm();
      fetchAccounts();
    } catch (error) {
      console.error("Error saving account:", error);
      toast.error("Could not save the account");
    }
  };

  const topbarButtons = (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button 
          className="bg-books-blue hover:bg-blue-700"
          onClick={() => {
            resetForm();
            setOpenDialog(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{editingAccount ? "Edit Account" : "Add New Account"}</DialogTitle>
          <DialogDescription>
            {editingAccount 
              ? "Update the account details below." 
              : "Enter the details for the new account."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_name">Account Name *</Label>
              <Input
                id="account_name"
                name="account_name"
                value={formData.account_name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_type">Account Type *</Label>
              <Select
                name="account_type"
                value={formData.account_type}
                onValueChange={(value) => handleSelectChange("account_type", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_code">Account Code</Label>
              <Input
                id="account_code"
                name="account_code"
                value={formData.account_code}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2 flex items-end gap-2">
              <Label htmlFor="status" className="flex-grow">Status</Label>
              <div className="flex items-center space-x-2 h-10">
                <Switch
                  id="status"
                  checked={formData.status === "Active"}
                  onCheckedChange={handleStatusChange}
                />
                <Label htmlFor="status">{formData.status}</Label>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpenDialog(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-books-blue hover:bg-blue-700">
              {editingAccount ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <MainLayout 
      title="Chart of Accounts" 
      searchPlaceholder="Search accounts" 
      topbarButtons={topbarButtons}
    >
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Chart of Accounts</h1>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Manage your financial accounts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table className="border-t">
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Account Type</TableHead>
                  <TableHead>Account Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      Loading accounts...
                    </TableCell>
                  </TableRow>
                ) : accounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      No accounts found
                    </TableCell>
                  </TableRow>
                ) : (
                  accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>{account.account_name}</TableCell>
                      <TableCell>{account.account_type}</TableCell>
                      <TableCell>{account.account_code || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {account.description || "-"}
                      </TableCell>
                      <TableCell>
                        <span 
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            account.status === "Active" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {account.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditAccount(account)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteAccount(account.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ChartOfAccounts;
