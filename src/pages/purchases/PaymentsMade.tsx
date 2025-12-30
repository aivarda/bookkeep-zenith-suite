import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Wallet } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

interface PaymentMade {
  id: string;
  payment_number: string;
  vendor_id: string | null;
  expense_id: string | null;
  date: string;
  amount: number;
  payment_mode: string | null;
  reference_number: string | null;
  notes: string | null;
  vendor?: { name: string } | null;
}

interface Vendor {
  id: string;
  name: string;
}

const PAYMENT_MODES = ["Cash", "Bank Transfer", "UPI", "Cheque", "Card"];

const PaymentsMade = () => {
  const [payments, setPayments] = useState<PaymentMade[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentMade | null>(null);
  const [formData, setFormData] = useState({
    payment_number: "",
    vendor_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    amount: 0,
    payment_mode: "Bank Transfer",
    reference_number: "",
    notes: "",
  });

  const fetchPayments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payments_made")
      .select("*, vendor:vendors(name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch payments");
    } else {
      setPayments(data || []);
    }
    setLoading(false);
  };

  const fetchVendors = async () => {
    const { data } = await supabase.from("vendors").select("id, name").order("name");
    setVendors(data || []);
  };

  const generatePaymentNumber = async () => {
    const { count } = await supabase
      .from("payments_made")
      .select("*", { count: "exact", head: true });
    return `PAY-OUT-${String((count || 0) + 1).padStart(4, "0")}`;
  };

  useEffect(() => {
    fetchPayments();
    fetchVendors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      payment_number: formData.payment_number,
      vendor_id: formData.vendor_id || null,
      date: formData.date,
      amount: formData.amount,
      payment_mode: formData.payment_mode || null,
      reference_number: formData.reference_number || null,
      notes: formData.notes || null,
    };

    if (editingPayment) {
      const { error } = await supabase
        .from("payments_made")
        .update(payload)
        .eq("id", editingPayment.id);
      if (error) {
        toast.error("Failed to update payment");
      } else {
        toast.success("Payment updated successfully");
        setOpenDialog(false);
        fetchPayments();
      }
    } else {
      const { error } = await supabase.from("payments_made").insert(payload);
      if (error) {
        toast.error("Failed to record payment");
      } else {
        toast.success("Payment recorded successfully");
        setOpenDialog(false);
        fetchPayments();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("payments_made").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete payment");
    } else {
      toast.success("Payment deleted successfully");
      fetchPayments();
    }
  };

  const handleEdit = (payment: PaymentMade) => {
    setEditingPayment(payment);
    setFormData({
      payment_number: payment.payment_number,
      vendor_id: payment.vendor_id || "",
      date: payment.date,
      amount: payment.amount,
      payment_mode: payment.payment_mode || "Bank Transfer",
      reference_number: payment.reference_number || "",
      notes: payment.notes || "",
    });
    setOpenDialog(true);
  };

  const handleNewPayment = async () => {
    const paymentNumber = await generatePaymentNumber();
    setEditingPayment(null);
    setFormData({
      payment_number: paymentNumber,
      vendor_id: "",
      date: format(new Date(), "yyyy-MM-dd"),
      amount: 0,
      payment_mode: "Bank Transfer",
      reference_number: "",
      notes: "",
    });
    setOpenDialog(true);
  };

  const columns: ColumnDef<PaymentMade>[] = [
    { accessorKey: "payment_number", header: "Payment#" },
    {
      accessorKey: "vendor",
      header: "Vendor",
      cell: ({ row }) => row.original.vendor?.name || "—",
    },
    { accessorKey: "date", header: "Date" },
    { accessorKey: "payment_mode", header: "Mode", cell: ({ row }) => row.original.payment_mode || "—" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(row.original.amount),
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
    <Button className="bg-books-blue hover:bg-blue-700" onClick={handleNewPayment}>
      <Plus className="h-4 w-4 mr-1" /> Record Payment
    </Button>
  );

  return (
    <MainLayout title="Payments Made" searchPlaceholder="Search payments" topbarButtons={topbarButtons}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-books-blue" />
          <h1 className="text-2xl font-bold">Payments Made</h1>
        </div>

        <DataTable columns={columns} data={payments} isLoading={loading} />

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingPayment ? "Edit Payment" : "Record Payment"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Payment Number</Label>
                  <Input value={formData.payment_number} disabled />
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
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Payment Mode</Label>
                  <Select value={formData.payment_mode} onValueChange={(v) => setFormData({ ...formData, payment_mode: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_MODES.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reference Number</Label>
                  <Input value={formData.reference_number} onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
                <Button type="submit" className="bg-books-blue hover:bg-blue-700">
                  {editingPayment ? "Update" : "Record"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default PaymentsMade;
