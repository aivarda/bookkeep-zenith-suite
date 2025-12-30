import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash, DollarSign } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { supabase } from "@/integrations/supabase/client";

interface PaymentReceived {
  id: string;
  payment_number: string;
  date: string;
  client_id: string | null;
  client_name?: string;
  invoice_id: string | null;
  invoice_number?: string;
  amount: number;
  payment_mode: string | null;
  reference_number: string | null;
  notes: string | null;
}

interface Client {
  id: string;
  name: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string | null;
  total_amount: number;
}

const PaymentsReceived = () => {
  const [payments, setPayments] = useState<PaymentReceived[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentReceived | null>(null);
  const [summary, setSummary] = useState({
    total: 0,
    thisMonth: 0,
    thisWeek: 0,
  });

  const [formData, setFormData] = useState({
    payment_number: "",
    client_id: "",
    invoice_id: "",
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    payment_mode: "",
    reference_number: "",
    notes: "",
  });

  useEffect(() => {
    fetchPayments();
    fetchClients();
    fetchInvoices();
  }, []);

  const generatePaymentNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `PAY-${timestamp}`;
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, client_id, total_amount")
        .in("status", ["PENDING", "DRAFT"])
        .order("date_issued", { ascending: false });
      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments_received")
        .select("*")
        .order("date", { ascending: false });

      if (paymentsError) throw paymentsError;

      if (paymentsData && paymentsData.length > 0) {
        const clientIds = paymentsData
          .map((p) => p.client_id)
          .filter((id) => id !== null) as string[];
        const invoiceIds = paymentsData
          .map((p) => p.invoice_id)
          .filter((id) => id !== null) as string[];

        let clientLookup: Record<string, Client> = {};
        let invoiceLookup: Record<string, Invoice> = {};

        if (clientIds.length > 0) {
          const { data: clientsData } = await supabase
            .from("clients")
            .select("id, name")
            .in("id", clientIds);
          if (clientsData) {
            clientsData.forEach((c) => (clientLookup[c.id] = c));
          }
        }

        if (invoiceIds.length > 0) {
          const { data: invoicesData } = await supabase
            .from("invoices")
            .select("id, invoice_number, client_id, total_amount")
            .in("id", invoiceIds);
          if (invoicesData) {
            invoicesData.forEach((i) => (invoiceLookup[i.id] = i));
          }
        }

        const combinedData = paymentsData.map((payment) => ({
          ...payment,
          client_name: payment.client_id
            ? clientLookup[payment.client_id]?.name || "Unknown Client"
            : "No Client",
          invoice_number: payment.invoice_id
            ? invoiceLookup[payment.invoice_id]?.invoice_number || ""
            : "",
        }));

        setPayments(combinedData);

        // Calculate summary
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());

        let total = 0, thisMonth = 0, thisWeek = 0;
        combinedData.forEach((p) => {
          total += p.amount;
          const paymentDate = new Date(p.date);
          if (paymentDate >= startOfMonth) thisMonth += p.amount;
          if (paymentDate >= startOfWeek) thisWeek += p.amount;
        });
        setSummary({ total, thisMonth, thisWeek });
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Could not load payments");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "amount" ? parseFloat(value) || 0 : value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });

    // Auto-populate client when invoice is selected
    if (name === "invoice_id" && value) {
      const selectedInvoice = invoices.find((i) => i.id === value);
      if (selectedInvoice?.client_id) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          client_id: selectedInvoice.client_id || "",
          amount: selectedInvoice.total_amount,
        }));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      payment_number: generatePaymentNumber(),
      client_id: "",
      invoice_id: "",
      date: new Date().toISOString().split("T")[0],
      amount: 0,
      payment_mode: "",
      reference_number: "",
      notes: "",
    });
    setEditingPayment(null);
  };

  const handleEditPayment = (payment: PaymentReceived) => {
    setEditingPayment(payment);
    setFormData({
      payment_number: payment.payment_number,
      client_id: payment.client_id || "",
      invoice_id: payment.invoice_id || "",
      date: payment.date,
      amount: payment.amount,
      payment_mode: payment.payment_mode || "",
      reference_number: payment.reference_number || "",
      notes: payment.notes || "",
    });
    setOpenDialog(true);
  };

  const handleDeletePayment = async (id: string) => {
    try {
      const { error } = await supabase.from("payments_received").delete().eq("id", id);
      if (error) throw error;
      toast.success("Payment deleted successfully");
      fetchPayments();
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Could not delete the payment");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dataToSave = {
        payment_number: formData.payment_number,
        client_id: formData.client_id || null,
        invoice_id: formData.invoice_id || null,
        date: formData.date,
        amount: formData.amount,
        payment_mode: formData.payment_mode || null,
        reference_number: formData.reference_number || null,
        notes: formData.notes || null,
      };

      if (editingPayment) {
        const { error } = await supabase
          .from("payments_received")
          .update(dataToSave)
          .eq("id", editingPayment.id);
        if (error) throw error;
        toast.success("Payment updated successfully");
      } else {
        const { error } = await supabase.from("payments_received").insert(dataToSave);
        if (error) throw error;

        // Update invoice status to PAID if fully paid
        if (formData.invoice_id) {
          const invoice = invoices.find((i) => i.id === formData.invoice_id);
          if (invoice && formData.amount >= invoice.total_amount) {
            await supabase
              .from("invoices")
              .update({ status: "PAID" })
              .eq("id", formData.invoice_id);
          }
        }

        toast.success("Payment recorded successfully");
      }

      setOpenDialog(false);
      resetForm();
      fetchPayments();
      fetchInvoices();
    } catch (error) {
      console.error("Error saving payment:", error);
      toast.error("Could not save the payment");
    }
  };

  const columns: ColumnDef<PaymentReceived>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => new Date(row.getValue("date")).toLocaleDateString(),
    },
    {
      accessorKey: "payment_number",
      header: "Payment#",
      cell: ({ row }) => (
        <span className="text-books-blue font-medium">
          {row.getValue("payment_number")}
        </span>
      ),
    },
    {
      accessorKey: "client_name",
      header: "Customer",
    },
    {
      accessorKey: "invoice_number",
      header: "Invoice#",
    },
    {
      accessorKey: "payment_mode",
      header: "Mode",
      cell: ({ row }) => row.getValue("payment_mode") || "-",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        return (
          <span className="text-books-green font-medium">
            {new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
            }).format(amount)}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const payment = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditPayment(payment)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-700"
              onClick={() => handleDeletePayment(payment.id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const topbarButtons = (
    <Button
      className="bg-books-blue hover:bg-blue-700"
      onClick={() => {
        resetForm();
        setOpenDialog(true);
      }}
    >
      <Plus className="h-4 w-4 mr-1" /> Record Payment
    </Button>
  );

  return (
    <MainLayout
      title="Payments Received"
      searchPlaceholder="Search payments"
      topbarButtons={topbarButtons}
    >
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Payments Received</h1>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-books-light-blue flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-books-blue" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Received</p>
                  <p className="text-lg font-bold text-books-green">
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                    }).format(summary.total)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-lg font-bold">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(summary.thisMonth)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-lg font-bold">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(summary.thisWeek)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <DataTable columns={columns} data={payments} isLoading={loading} />
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingPayment ? "Edit Payment" : "Record Payment"}
            </DialogTitle>
            <DialogDescription>
              {editingPayment
                ? "Update the payment details below."
                : "Record a new payment from your customer."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_number">Payment Number *</Label>
                <Input
                  id="payment_number"
                  name="payment_number"
                  value={formData.payment_number}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Customer</Label>
                <Select
                  name="client_id"
                  value={formData.client_id}
                  onValueChange={(value) => handleSelectChange("client_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice_id">Invoice</Label>
                <Select
                  name="invoice_id"
                  value={formData.invoice_id}
                  onValueChange={(value) => handleSelectChange("invoice_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    {invoices.map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {invoice.invoice_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_mode">Payment Mode</Label>
                <Select
                  name="payment_mode"
                  value={formData.payment_mode}
                  onValueChange={(value) => handleSelectChange("payment_mode", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference_number">Reference Number</Label>
              <Input
                id="reference_number"
                name="reference_number"
                value={formData.reference_number}
                onChange={handleInputChange}
                placeholder="Transaction ID, Cheque No., etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
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
                {editingPayment ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default PaymentsReceived;
