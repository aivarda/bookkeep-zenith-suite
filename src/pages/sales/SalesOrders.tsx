import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash } from "lucide-react";
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

interface SalesOrder {
  id: string;
  order_number: string;
  date: string;
  expected_shipment_date: string | null;
  client_id: string | null;
  client_name?: string;
  status: string;
  total_amount: number;
  notes: string | null;
}

interface Client {
  id: string;
  name: string;
}

const statusColors: Record<string, string> = {
  DRAFT: "text-gray-500",
  CONFIRMED: "text-books-blue",
  SHIPPED: "text-books-yellow",
  DELIVERED: "text-books-green",
  CANCELLED: "text-books-red",
};

const SalesOrders = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);
  const [summary, setSummary] = useState({
    draft: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
  });

  const [formData, setFormData] = useState({
    order_number: "",
    client_id: "",
    date: new Date().toISOString().split("T")[0],
    expected_shipment_date: "",
    status: "DRAFT",
    total_amount: 0,
    notes: "",
  });

  useEffect(() => {
    fetchOrders();
    fetchClients();
  }, []);

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `SO-${timestamp}`;
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

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("sales_orders")
        .select("*")
        .order("date", { ascending: false });

      if (ordersError) throw ordersError;

      if (ordersData && ordersData.length > 0) {
        const clientIds = ordersData
          .map((order) => order.client_id)
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

        const combinedData = ordersData.map((order) => ({
          ...order,
          client_name: order.client_id
            ? clientLookup[order.client_id]?.name || "Unknown Client"
            : "No Client",
        }));

        setOrders(combinedData);

        // Calculate summary
        let draft = 0, confirmed = 0, shipped = 0, delivered = 0;
        combinedData.forEach((order) => {
          switch (order.status) {
            case "DRAFT": draft += order.total_amount; break;
            case "CONFIRMED": confirmed += order.total_amount; break;
            case "SHIPPED": shipped += order.total_amount; break;
            case "DELIVERED": delivered += order.total_amount; break;
          }
        });
        setSummary({ draft, confirmed, shipped, delivered });
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching sales orders:", error);
      toast.error("Could not load sales orders");
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
      order_number: generateOrderNumber(),
      client_id: "",
      date: new Date().toISOString().split("T")[0],
      expected_shipment_date: "",
      status: "DRAFT",
      total_amount: 0,
      notes: "",
    });
    setEditingOrder(null);
  };

  const handleEditOrder = (order: SalesOrder) => {
    setEditingOrder(order);
    setFormData({
      order_number: order.order_number,
      client_id: order.client_id || "",
      date: order.date,
      expected_shipment_date: order.expected_shipment_date || "",
      status: order.status,
      total_amount: order.total_amount,
      notes: order.notes || "",
    });
    setOpenDialog(true);
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      const { error } = await supabase.from("sales_orders").delete().eq("id", id);
      if (error) throw error;
      toast.success("Sales order deleted successfully");
      fetchOrders();
    } catch (error) {
      console.error("Error deleting sales order:", error);
      toast.error("Could not delete the sales order");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dataToSave = {
        order_number: formData.order_number,
        client_id: formData.client_id || null,
        date: formData.date,
        expected_shipment_date: formData.expected_shipment_date || null,
        status: formData.status,
        total_amount: formData.total_amount,
        notes: formData.notes || null,
      };

      if (editingOrder) {
        const { error } = await supabase
          .from("sales_orders")
          .update(dataToSave)
          .eq("id", editingOrder.id);
        if (error) throw error;
        toast.success("Sales order updated successfully");
      } else {
        const { error } = await supabase.from("sales_orders").insert(dataToSave);
        if (error) throw error;
        toast.success("Sales order created successfully");
      }

      setOpenDialog(false);
      resetForm();
      fetchOrders();
    } catch (error) {
      console.error("Error saving sales order:", error);
      toast.error("Could not save the sales order");
    }
  };

  const columns: ColumnDef<SalesOrder>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => new Date(row.getValue("date")).toLocaleDateString(),
    },
    {
      accessorKey: "order_number",
      header: "Order#",
      cell: ({ row }) => (
        <span className="text-books-blue font-medium">
          {row.getValue("order_number")}
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
      accessorKey: "expected_shipment_date",
      header: "Expected Shipment",
      cell: ({ row }) => {
        const date = row.getValue("expected_shipment_date") as string | null;
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
        const order = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditOrder(order)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-700"
              onClick={() => handleDeleteOrder(order.id)}
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
      <Plus className="h-4 w-4 mr-1" /> New Sales Order
    </Button>
  );

  return (
    <MainLayout
      title="Sales Orders"
      searchPlaceholder="Search sales orders"
      topbarButtons={topbarButtons}
    >
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">All Sales Orders</h1>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
              Order Summary
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
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-lg font-bold text-books-blue">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(summary.confirmed)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Shipped</p>
                <p className="text-lg font-bold text-books-yellow">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(summary.shipped)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="text-lg font-bold text-books-green">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(summary.delivered)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <DataTable columns={columns} data={orders} isLoading={loading} />
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingOrder ? "Edit Sales Order" : "New Sales Order"}
            </DialogTitle>
            <DialogDescription>
              {editingOrder
                ? "Update the sales order details below."
                : "Create a new sales order for your customer."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order_number">Order Number *</Label>
                <Input
                  id="order_number"
                  name="order_number"
                  value={formData.order_number}
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
                <Label htmlFor="date">Order Date *</Label>
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
                <Label htmlFor="expected_shipment_date">Expected Shipment Date</Label>
                <Input
                  id="expected_shipment_date"
                  name="expected_shipment_date"
                  type="date"
                  value={formData.expected_shipment_date}
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
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="SHIPPED">Shipped</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
                {editingOrder ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default SalesOrders;
