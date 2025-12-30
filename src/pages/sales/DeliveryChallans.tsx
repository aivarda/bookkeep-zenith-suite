import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash, Truck } from "lucide-react";
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

interface DeliveryChallan {
  id: string;
  challan_number: string;
  date: string;
  client_id: string | null;
  client_name?: string;
  status: string;
  notes: string | null;
}

interface Client {
  id: string;
  name: string;
}

const statusColors: Record<string, string> = {
  DRAFT: "text-gray-500",
  SENT: "text-books-blue",
  DELIVERED: "text-books-green",
};

const DeliveryChallans = () => {
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingChallan, setEditingChallan] = useState<DeliveryChallan | null>(null);
  const [summary, setSummary] = useState({
    draft: 0,
    sent: 0,
    delivered: 0,
  });

  const [formData, setFormData] = useState({
    challan_number: "",
    client_id: "",
    date: new Date().toISOString().split("T")[0],
    status: "DRAFT",
    notes: "",
  });

  useEffect(() => {
    fetchChallans();
    fetchClients();
  }, []);

  const generateChallanNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `DC-${timestamp}`;
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

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const { data: challansData, error: challansError } = await supabase
        .from("delivery_challans")
        .select("*")
        .order("date", { ascending: false });

      if (challansError) throw challansError;

      if (challansData && challansData.length > 0) {
        const clientIds = challansData
          .map((c) => c.client_id)
          .filter((id) => id !== null) as string[];

        let clientLookup: Record<string, Client> = {};
        if (clientIds.length > 0) {
          const { data: clientsData } = await supabase
            .from("clients")
            .select("id, name")
            .in("id", clientIds);
          if (clientsData) {
            clientsData.forEach((c) => (clientLookup[c.id] = c));
          }
        }

        const combinedData = challansData.map((challan) => ({
          ...challan,
          client_name: challan.client_id
            ? clientLookup[challan.client_id]?.name || "Unknown Client"
            : "No Client",
        }));

        setChallans(combinedData);

        // Calculate summary
        let draft = 0, sent = 0, delivered = 0;
        combinedData.forEach((c) => {
          switch (c.status) {
            case "DRAFT": draft++; break;
            case "SENT": sent++; break;
            case "DELIVERED": delivered++; break;
          }
        });
        setSummary({ draft, sent, delivered });
      } else {
        setChallans([]);
      }
    } catch (error) {
      console.error("Error fetching challans:", error);
      toast.error("Could not load delivery challans");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({
      challan_number: generateChallanNumber(),
      client_id: "",
      date: new Date().toISOString().split("T")[0],
      status: "DRAFT",
      notes: "",
    });
    setEditingChallan(null);
  };

  const handleEditChallan = (challan: DeliveryChallan) => {
    setEditingChallan(challan);
    setFormData({
      challan_number: challan.challan_number,
      client_id: challan.client_id || "",
      date: challan.date,
      status: challan.status,
      notes: challan.notes || "",
    });
    setOpenDialog(true);
  };

  const handleDeleteChallan = async (id: string) => {
    try {
      const { error } = await supabase.from("delivery_challans").delete().eq("id", id);
      if (error) throw error;
      toast.success("Delivery challan deleted successfully");
      fetchChallans();
    } catch (error) {
      console.error("Error deleting challan:", error);
      toast.error("Could not delete the delivery challan");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dataToSave = {
        challan_number: formData.challan_number,
        client_id: formData.client_id || null,
        date: formData.date,
        status: formData.status,
        notes: formData.notes || null,
      };

      if (editingChallan) {
        const { error } = await supabase
          .from("delivery_challans")
          .update(dataToSave)
          .eq("id", editingChallan.id);
        if (error) throw error;
        toast.success("Delivery challan updated successfully");
      } else {
        const { error } = await supabase.from("delivery_challans").insert(dataToSave);
        if (error) throw error;
        toast.success("Delivery challan created successfully");
      }

      setOpenDialog(false);
      resetForm();
      fetchChallans();
    } catch (error) {
      console.error("Error saving challan:", error);
      toast.error("Could not save the delivery challan");
    }
  };

  const columns: ColumnDef<DeliveryChallan>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => new Date(row.getValue("date")).toLocaleDateString(),
    },
    {
      accessorKey: "challan_number",
      header: "Challan#",
      cell: ({ row }) => (
        <span className="text-books-blue font-medium">
          {row.getValue("challan_number")}
        </span>
      ),
    },
    {
      accessorKey: "client_name",
      header: "Customer",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <span className={statusColors[status] || "text-gray-500"}>
            {status}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const challan = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditChallan(challan)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-700"
              onClick={() => handleDeleteChallan(challan.id)}
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
      <Plus className="h-4 w-4 mr-1" /> New Delivery Challan
    </Button>
  );

  return (
    <MainLayout
      title="Delivery Challans"
      searchPlaceholder="Search challans"
      topbarButtons={topbarButtons}
    >
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Delivery Challans</h1>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
              Challan Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Draft</p>
                  <p className="text-lg font-bold text-gray-500">{summary.draft}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sent</p>
                <p className="text-lg font-bold text-books-blue">{summary.sent}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="text-lg font-bold text-books-green">{summary.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <DataTable columns={columns} data={challans} isLoading={loading} />
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingChallan ? "Edit Delivery Challan" : "New Delivery Challan"}
            </DialogTitle>
            <DialogDescription>
              {editingChallan
                ? "Update the delivery challan details below."
                : "Create a new delivery challan for your customer."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="challan_number">Challan Number *</Label>
                <Input
                  id="challan_number"
                  name="challan_number"
                  value={formData.challan_number}
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
                <Label htmlFor="status">Status</Label>
                <Select
                  name="status"
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SENT">Sent</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                {editingChallan ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default DeliveryChallans;
