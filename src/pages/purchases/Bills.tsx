import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

interface Expense {
  id: string;
  expense_number: string;
  vendor_id: string | null;
  date: string;
  due_date: string | null;
  status: string;
  total_amount: number;
  category: string | null;
  notes: string | null;
  vendor?: { name: string } | null;
}

interface Vendor {
  id: string;
  name: string;
}

const STATUS_OPTIONS = ["DRAFT", "PENDING", "PAID", "OVERDUE"];

const Bills = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    expense_number: "",
    vendor_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    due_date: "",
    status: "DRAFT",
    total_amount: 0,
    category: "",
    notes: "",
  });

  const fetchExpenses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("*, vendor:vendors(name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch bills");
    } else {
      setExpenses(data || []);
    }
    setLoading(false);
  };

  const fetchVendors = async () => {
    const { data } = await supabase.from("vendors").select("id, name").order("name");
    setVendors(data || []);
  };

  const generateExpenseNumber = async () => {
    const { count } = await supabase
      .from("expenses")
      .select("*", { count: "exact", head: true });
    return `BILL-${String((count || 0) + 1).padStart(4, "0")}`;
  };

  useEffect(() => {
    fetchExpenses();
    fetchVendors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      expense_number: formData.expense_number,
      vendor_id: formData.vendor_id || null,
      date: formData.date,
      due_date: formData.due_date || null,
      status: formData.status,
      total_amount: formData.total_amount,
      category: formData.category || null,
      notes: formData.notes || null,
    };

    if (editingExpense) {
      const { error } = await supabase
        .from("expenses")
        .update(payload)
        .eq("id", editingExpense.id);
      if (error) {
        toast.error("Failed to update bill");
      } else {
        toast.success("Bill updated successfully");
        setOpenDialog(false);
        fetchExpenses();
      }
    } else {
      const { error } = await supabase.from("expenses").insert(payload);
      if (error) {
        toast.error("Failed to create bill");
      } else {
        toast.success("Bill created successfully");
        setOpenDialog(false);
        fetchExpenses();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete bill");
    } else {
      toast.success("Bill deleted successfully");
      fetchExpenses();
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      expense_number: expense.expense_number,
      vendor_id: expense.vendor_id || "",
      date: expense.date,
      due_date: expense.due_date || "",
      status: expense.status,
      total_amount: expense.total_amount,
      category: expense.category || "",
      notes: expense.notes || "",
    });
    setOpenDialog(true);
  };

  const handleNewBill = async () => {
    const expenseNumber = await generateExpenseNumber();
    setEditingExpense(null);
    setFormData({
      expense_number: expenseNumber,
      vendor_id: "",
      date: format(new Date(), "yyyy-MM-dd"),
      due_date: "",
      status: "DRAFT",
      total_amount: 0,
      category: "",
      notes: "",
    });
    setOpenDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      DRAFT: "secondary",
      PENDING: "outline",
      PAID: "default",
      OVERDUE: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const columns: ColumnDef<Expense>[] = [
    { accessorKey: "expense_number", header: "Bill#" },
    {
      accessorKey: "vendor",
      header: "Vendor",
      cell: ({ row }) => row.original.vendor?.name || "—",
    },
    { accessorKey: "date", header: "Date" },
    { accessorKey: "due_date", header: "Due Date", cell: ({ row }) => row.original.due_date || "—" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "total_amount",
      header: "Amount",
      cell: ({ row }) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(row.original.total_amount),
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
    <Button className="bg-books-blue hover:bg-blue-700" onClick={handleNewBill}>
      <Plus className="h-4 w-4 mr-1" /> New Bill
    </Button>
  );

  return (
    <MainLayout title="Bills" searchPlaceholder="Search bills" topbarButtons={topbarButtons}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-books-blue" />
          <h1 className="text-2xl font-bold">Bills</h1>
        </div>

        <DataTable columns={columns} data={expenses} isLoading={loading} />

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Edit Bill" : "New Bill"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Bill Number</Label>
                  <Input value={formData.expense_number} disabled />
                </div>
                <div>
                  <Label>Vendor</Label>
                  <Select value={formData.vendor_id} onValueChange={(v) => setFormData({ ...formData, vendor_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
                <Button type="submit" className="bg-books-blue hover:bg-blue-700">
                  {editingExpense ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Bills;
