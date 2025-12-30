import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ClipboardList } from "lucide-react";
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

interface PurchaseOrder {
  id: string;
  order_number: string;
  vendor_id: string | null;
  date: string;
  expected_delivery_date: string | null;
  status: string;
  total_amount: number;
  notes: string | null;
  vendor?: { name: string } | null;
}

interface Vendor {
  id: string;
  name: string;
}

const STATUS_OPTIONS = ["DRAFT", "ISSUED", "RECEIVED", "BILLED", "CANCELLED"];

const PurchaseOrders = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [formData, setFormData] = useState({
    order_number: "",
    vendor_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    expected_delivery_date: "",
    status: "DRAFT",
    total_amount: 0,
    notes: "",
  });

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("purchase_orders")
      .select("*, vendor:vendors(name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch purchase orders");
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const fetchVendors = async () => {
    const { data } = await supabase.from("vendors").select("id, name").order("name");
    setVendors(data || []);
  };

  const generateOrderNumber = async () => {
    const { count } = await supabase
      .from("purchase_orders")
      .select("*", { count: "exact", head: true });
    return `PO-${String((count || 0) + 1).padStart(4, "0")}`;
  };

  useEffect(() => {
    fetchOrders();
    fetchVendors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      order_number: formData.order_number,
      vendor_id: formData.vendor_id || null,
      date: formData.date,
      expected_delivery_date: formData.expected_delivery_date || null,
      status: formData.status,
      total_amount: formData.total_amount,
      notes: formData.notes || null,
    };

    if (editingOrder) {
      const { error } = await supabase
        .from("purchase_orders")
        .update(payload)
        .eq("id", editingOrder.id);
      if (error) {
        toast.error("Failed to update purchase order");
      } else {
        toast.success("Purchase order updated successfully");
        setOpenDialog(false);
        fetchOrders();
      }
    } else {
      const { error } = await supabase.from("purchase_orders").insert(payload);
      if (error) {
        toast.error("Failed to create purchase order");
      } else {
        toast.success("Purchase order created successfully");
        setOpenDialog(false);
        fetchOrders();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("purchase_orders").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete purchase order");
    } else {
      toast.success("Purchase order deleted successfully");
      fetchOrders();
    }
  };

  const handleEdit = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setFormData({
      order_number: order.order_number,
      vendor_id: order.vendor_id || "",
      date: order.date,
      expected_delivery_date: order.expected_delivery_date || "",
      status: order.status,
      total_amount: order.total_amount,
      notes: order.notes || "",
    });
    setOpenDialog(true);
  };

  const handleNewOrder = async () => {
    const orderNumber = await generateOrderNumber();
    setEditingOrder(null);
    setFormData({
      order_number: orderNumber,
      vendor_id: "",
      date: format(new Date(), "yyyy-MM-dd"),
      expected_delivery_date: "",
      status: "DRAFT",
      total_amount: 0,
      notes: "",
    });
    setOpenDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      DRAFT: "secondary",
      ISSUED: "outline",
      RECEIVED: "default",
      BILLED: "default",
      CANCELLED: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const columns: ColumnDef<PurchaseOrder>[] = [
    { accessorKey: "order_number", header: "Order#" },
    {
      accessorKey: "vendor",
      header: "Vendor",
      cell: ({ row }) => row.original.vendor?.name || "—",
    },
    { accessorKey: "date", header: "Date" },
    { accessorKey: "expected_delivery_date", header: "Expected Delivery", cell: ({ row }) => row.original.expected_delivery_date || "—" },
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
    <Button className="bg-books-blue hover:bg-blue-700" onClick={handleNewOrder}>
      <Plus className="h-4 w-4 mr-1" /> New Purchase Order
    </Button>
  );

  return (
    <MainLayout title="Purchase Orders" searchPlaceholder="Search purchase orders" topbarButtons={topbarButtons}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-books-blue" />
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
        </div>

        <DataTable columns={columns} data={orders} isLoading={loading} />

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingOrder ? "Edit Purchase Order" : "New Purchase Order"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Order Number</Label>
                  <Input value={formData.order_number} disabled />
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
                  <Label>Expected Delivery</Label>
                  <Input type="date" value={formData.expected_delivery_date} onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })} />
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
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
                <Button type="submit" className="bg-books-blue hover:bg-blue-700">
                  {editingOrder ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default PurchaseOrders;
