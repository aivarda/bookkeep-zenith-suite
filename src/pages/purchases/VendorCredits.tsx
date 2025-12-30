import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Receipt } from "lucide-react";
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

interface VendorCredit {
  id: string;
  credit_number: string;
  vendor_id: string | null;
  date: string;
  status: string;
  total_amount: number;
  notes: string | null;
  vendor?: { name: string } | null;
}

interface Vendor {
  id: string;
  name: string;
}

const STATUS_OPTIONS = ["OPEN", "CLOSED"];

const VendorCredits = () => {
  const [credits, setCredits] = useState<VendorCredit[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCredit, setEditingCredit] = useState<VendorCredit | null>(null);
  const [formData, setFormData] = useState({
    credit_number: "",
    vendor_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    status: "OPEN",
    total_amount: 0,
    notes: "",
  });

  const fetchCredits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vendor_credits")
      .select("*, vendor:vendors(name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch vendor credits");
    } else {
      setCredits(data || []);
    }
    setLoading(false);
  };

  const fetchVendors = async () => {
    const { data } = await supabase.from("vendors").select("id, name").order("name");
    setVendors(data || []);
  };

  const generateCreditNumber = async () => {
    const { count } = await supabase
      .from("vendor_credits")
      .select("*", { count: "exact", head: true });
    return `VC-${String((count || 0) + 1).padStart(4, "0")}`;
  };

  useEffect(() => {
    fetchCredits();
    fetchVendors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      credit_number: formData.credit_number,
      vendor_id: formData.vendor_id || null,
      date: formData.date,
      status: formData.status,
      total_amount: formData.total_amount,
      notes: formData.notes || null,
    };

    if (editingCredit) {
      const { error } = await supabase
        .from("vendor_credits")
        .update(payload)
        .eq("id", editingCredit.id);
      if (error) {
        toast.error("Failed to update vendor credit");
      } else {
        toast.success("Vendor credit updated successfully");
        setOpenDialog(false);
        fetchCredits();
      }
    } else {
      const { error } = await supabase.from("vendor_credits").insert(payload);
      if (error) {
        toast.error("Failed to create vendor credit");
      } else {
        toast.success("Vendor credit created successfully");
        setOpenDialog(false);
        fetchCredits();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("vendor_credits").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete vendor credit");
    } else {
      toast.success("Vendor credit deleted successfully");
      fetchCredits();
    }
  };

  const handleEdit = (credit: VendorCredit) => {
    setEditingCredit(credit);
    setFormData({
      credit_number: credit.credit_number,
      vendor_id: credit.vendor_id || "",
      date: credit.date,
      status: credit.status,
      total_amount: credit.total_amount,
      notes: credit.notes || "",
    });
    setOpenDialog(true);
  };

  const handleNewCredit = async () => {
    const creditNumber = await generateCreditNumber();
    setEditingCredit(null);
    setFormData({
      credit_number: creditNumber,
      vendor_id: "",
      date: format(new Date(), "yyyy-MM-dd"),
      status: "OPEN",
      total_amount: 0,
      notes: "",
    });
    setOpenDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary"> = {
      OPEN: "default",
      CLOSED: "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const columns: ColumnDef<VendorCredit>[] = [
    { accessorKey: "credit_number", header: "Credit#" },
    {
      accessorKey: "vendor",
      header: "Vendor",
      cell: ({ row }) => row.original.vendor?.name || "—",
    },
    { accessorKey: "date", header: "Date" },
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
    <Button className="bg-books-blue hover:bg-blue-700" onClick={handleNewCredit}>
      <Plus className="h-4 w-4 mr-1" /> New Vendor Credit
    </Button>
  );

  return (
    <MainLayout title="Vendor Credits" searchPlaceholder="Search vendor credits" topbarButtons={topbarButtons}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Receipt className="h-6 w-6 text-books-blue" />
          <h1 className="text-2xl font-bold">Vendor Credits</h1>
        </div>

        <DataTable columns={columns} data={credits} isLoading={loading} />

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCredit ? "Edit Vendor Credit" : "New Vendor Credit"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Credit Number</Label>
                  <Input value={formData.credit_number} disabled />
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
                  {editingCredit ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default VendorCredits;
