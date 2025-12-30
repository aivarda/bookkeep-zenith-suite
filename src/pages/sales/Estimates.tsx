import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash, FileText, DollarSign, ArrowRight } from "lucide-react";
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

interface Estimate {
  id: string;
  estimate_number: string;
  date: string;
  expiry_date: string | null;
  client_id: string | null;
  client_name?: string;
  status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
}

const statusColors: Record<string, string> = {
  DRAFT: "text-gray-500",
  SENT: "text-books-blue",
  ACCEPTED: "text-books-green",
  DECLINED: "text-books-red",
  INVOICED: "text-purple-600",
};

const Estimates = () => {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<Estimate | null>(null);
  const [summary, setSummary] = useState({
    draft: 0,
    sent: 0,
    accepted: 0,
    declined: 0,
  });

  const [formData, setFormData] = useState({
    estimate_number: "",
    client_id: "",
    date: new Date().toISOString().split("T")[0],
    expiry_date: "",
    status: "DRAFT",
    total_amount: 0,
    notes: "",
  });

  useEffect(() => {
    fetchEstimates();
    fetchClients();
  }, []);

  const generateEstimateNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `EST-${timestamp}`;
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

  const fetchEstimates = async () => {
    setLoading(true);
    try {
      const { data: estimatesData, error: estimatesError } = await supabase
        .from("estimates")
        .select("*")
        .order("date", { ascending: false });

      if (estimatesError) throw estimatesError;

      if (estimatesData && estimatesData.length > 0) {
        const clientIds = estimatesData
          .map((est) => est.client_id)
          .filter((id) => id !== null) as string[];

        let clientLookup: Record<string, Client> = {};
        if (clientIds.length > 0) {
          const { data: clientsData, error: clientsError } = await supabase
            .from("clients")
            .select("id, name")
            .in("id", clientIds);

          if (clientsError) throw clientsError;

          if (clientsData) {
            clientsData.forEach((client) => {
              clientLookup[client.id] = client;
            });
          }
        }

        const combinedData = estimatesData.map((estimate) => ({
          ...estimate,
          client_name: estimate.client_id
            ? clientLookup[estimate.client_id]?.name || "Unknown Client"
            : "No Client",
        }));

        setEstimates(combinedData);

        // Calculate summary
        let draft = 0, sent = 0, accepted = 0, declined = 0;
        combinedData.forEach((est) => {
          switch (est.status) {
            case "DRAFT": draft += est.total_amount; break;
            case "SENT": sent += est.total_amount; break;
            case "ACCEPTED": accepted += est.total_amount; break;
            case "DECLINED": declined += est.total_amount; break;
          }
        });
        setSummary({ draft, sent, accepted, declined });
      } else {
        setEstimates([]);
      }
    } catch (error) {
      console.error("Error fetching estimates:", error);
      toast.error("Could not load estimates");
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
      [name]: name === "total_amount" ? parseFloat(value) || 0 : value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({
      estimate_number: generateEstimateNumber(),
      client_id: "",
      date: new Date().toISOString().split("T")[0],
      expiry_date: "",
      status: "DRAFT",
      total_amount: 0,
      notes: "",
    });
    setEditingEstimate(null);
  };

  const handleEditEstimate = (estimate: Estimate) => {
    setEditingEstimate(estimate);
    setFormData({
      estimate_number: estimate.estimate_number,
      client_id: estimate.client_id || "",
      date: estimate.date,
      expiry_date: estimate.expiry_date || "",
      status: estimate.status,
      total_amount: estimate.total_amount,
      notes: estimate.notes || "",
    });
    setOpenDialog(true);
  };

  const handleDeleteEstimate = async (id: string) => {
    try {
      const { error } = await supabase.from("estimates").delete().eq("id", id);
      if (error) throw error;
      toast.success("Estimate deleted successfully");
      fetchEstimates();
    } catch (error) {
      console.error("Error deleting estimate:", error);
      toast.error("Could not delete the estimate");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dataToSave = {
        estimate_number: formData.estimate_number,
        client_id: formData.client_id || null,
        date: formData.date,
        expiry_date: formData.expiry_date || null,
        status: formData.status,
        total_amount: formData.total_amount,
        notes: formData.notes || null,
      };

      if (editingEstimate) {
        const { error } = await supabase
          .from("estimates")
          .update(dataToSave)
          .eq("id", editingEstimate.id);
        if (error) throw error;
        toast.success("Estimate updated successfully");
      } else {
        const { error } = await supabase.from("estimates").insert(dataToSave);
        if (error) throw error;
        toast.success("Estimate created successfully");
      }

      setOpenDialog(false);
      resetForm();
      fetchEstimates();
    } catch (error) {
      console.error("Error saving estimate:", error);
      toast.error("Could not save the estimate");
    }
  };

  const columns: ColumnDef<Estimate>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => new Date(row.getValue("date")).toLocaleDateString(),
    },
    {
      accessorKey: "estimate_number",
      header: "Estimate#",
      cell: ({ row }) => (
        <span className="text-books-blue font-medium">
          {row.getValue("estimate_number")}
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
      accessorKey: "expiry_date",
      header: "Expiry Date",
      cell: ({ row }) => {
        const date = row.getValue("expiry_date") as string | null;
        return date ? new Date(date).toLocaleDateString() : "-";
      },
    },
    {
      accessorKey: "total_amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("total_amount"));
        return new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(amount);
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const estimate = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditEstimate(estimate)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-700"
              onClick={() => handleDeleteEstimate(estimate.id)}
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
      <Plus className="h-4 w-4 mr-1" /> New Estimate
    </Button>
  );

  return (
    <MainLayout
      title="Estimates"
      searchPlaceholder="Search estimates"
      topbarButtons={topbarButtons}
    >
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">All Estimates</h1>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
              Estimate Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Draft</p>
                <p className="text-lg font-bold text-gray-500">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(summary.draft)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sent</p>
                <p className="text-lg font-bold text-books-blue">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(summary.sent)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accepted</p>
                <p className="text-lg font-bold text-books-green">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(summary.accepted)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Declined</p>
                <p className="text-lg font-bold text-books-red">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(summary.declined)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <DataTable columns={columns} data={estimates} isLoading={loading} />
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingEstimate ? "Edit Estimate" : "New Estimate"}
            </DialogTitle>
            <DialogDescription>
              {editingEstimate
                ? "Update the estimate details below."
                : "Create a new estimate for your customer."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimate_number">Estimate Number *</Label>
                <Input
                  id="estimate_number"
                  name="estimate_number"
                  value={formData.estimate_number}
                  onChange={handleInputChange}
                  required
                />
              </div>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input
                  id="expiry_date"
                  name="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                    <SelectItem value="DECLINED">Declined</SelectItem>
                    <SelectItem value="INVOICED">Invoiced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_amount">Amount *</Label>
                <Input
                  id="total_amount"
                  name="total_amount"
                  type="number"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={handleInputChange}
                  required
                />
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
                {editingEstimate ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Estimates;
