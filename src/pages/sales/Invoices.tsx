import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, DollarSign, Mail, Eye, Trash, Upload } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import SendInvoiceDialog from "@/components/invoice/SendInvoiceDialog";
import { ImportDialog } from "@/components/import/ImportDialog";
import { ZOHO_FIELD_MAPPINGS } from "@/lib/import-utils";

interface Invoice {
  id: string;
  invoice_number: string;
  date_issued: string;
  due_date: string;
  client_id: string | null;
  client_name?: string;
  client_email?: string;
  status: string;
  total_amount: number;
  created_at: string;
}

const statusColors: Record<string, string> = {
  PAID: "text-books-green",
  PENDING: "text-books-yellow",
  DRAFT: "text-gray-500",
  OVERDUE: "text-books-red",
};

const Invoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [invoiceToSend, setInvoiceToSend] = useState<Invoice | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [summary, setSummary] = useState({
    totalReceivables: 0,
    dueToday: 0,
    dueThirtyDays: 0,
    overdue: 0,
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      // Fetch invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select("*")
        .order("date_issued", { ascending: false });
        
      if (invoicesError) throw invoicesError;
      
      // Fetch client data for each invoice
      if (invoicesData && invoicesData.length > 0) {
        const clientIds = invoicesData
          .map(inv => inv.client_id)
          .filter(id => id !== null) as string[];
          
        const { data: clients, error: clientsError } = await supabase
          .from("clients")
          .select("id, name, email")
          .in("id", clientIds);
          
        if (clientsError) throw clientsError;
        
        // Create a lookup object for client data
        const clientLookup: Record<string, any> = {};
        if (clients) {
          clients.forEach(client => {
            clientLookup[client.id] = client;
          });
        }
        
        // Combine invoice and client data
        const combinedData = invoicesData.map(invoice => ({
          ...invoice,
          client_name: invoice.client_id ? (clientLookup[invoice.client_id]?.name || "Unknown Client") : "Unknown Client",
          client_email: invoice.client_id ? (clientLookup[invoice.client_id]?.email || "") : ""
        }));
        
        setInvoices(combinedData);
        
        // Calculate summary
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let totalReceivables = 0;
        let dueToday = 0;
        let dueThirtyDays = 0;
        let overdue = 0;
        
        combinedData.forEach(inv => {
          if (inv.status !== "PAID") {
            totalReceivables += inv.total_amount;
            
            const dueDate = new Date(inv.due_date);
            dueDate.setHours(0, 0, 0, 0);
            
            // Due today
            if (dueDate.getTime() === today.getTime()) {
              dueToday += inv.total_amount;
            }
            
            // Due within 30 days
            const thirtyDaysLater = new Date(today);
            thirtyDaysLater.setDate(today.getDate() + 30);
            
            if (dueDate > today && dueDate <= thirtyDaysLater) {
              dueThirtyDays += inv.total_amount;
            }
            
            // Overdue
            if (dueDate < today) {
              overdue += inv.total_amount;
            }
          }
        });
        
        setSummary({
          totalReceivables,
          dueToday,
          dueThirtyDays,
          overdue
        });
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Could not load invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    
    try {
      // First delete invoice items
      await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", invoiceToDelete.id);
        
      // Then delete the invoice
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", invoiceToDelete.id);
        
      if (error) throw error;
      
      toast.success("Invoice deleted successfully");
      fetchInvoices();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Could not delete the invoice");
    } finally {
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const openDeleteDialog = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const openSendDialog = (invoice: Invoice) => {
    setInvoiceToSend(invoice);
    setSendDialogOpen(true);
  };

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: "date_issued",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("date_issued"));
        return date.toLocaleDateString();
      }
    },
    {
      accessorKey: "invoice_number",
      header: "Invoice#",
      cell: ({ row }) => (
        <span 
          className="text-books-blue cursor-pointer hover:underline"
          onClick={() => navigate(`/sales/invoices/${row.original.id}`)}
        >
          {row.getValue("invoice_number")}
        </span>
      ),
    },
    {
      accessorKey: "client_name",
      header: "Customer Name",
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
      accessorKey: "due_date",
      header: "Due Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("due_date"));
        return date.toLocaleDateString();
      }
    },
    {
      accessorKey: "total_amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("total_amount"));
        const formatted = new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(amount);
        return <div>{formatted}</div>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              title="View Invoice"
              onClick={() => navigate(`/sales/invoices/${invoice.id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              title="Send Email"
              onClick={() => openSendDialog(invoice)}
            >
              <Mail className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              title="Delete"
              onClick={() => openDeleteDialog(invoice)}
              className="text-destructive hover:text-destructive"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const handleImport = async (data: Record<string, unknown>[]) => {
    let success = 0;
    let failed = 0;

    // Fetch all clients to match by name
    const { data: clients } = await supabase.from("clients").select("id, name");
    const clientLookup: Record<string, string> = {};
    clients?.forEach(c => {
      clientLookup[c.name.toLowerCase().trim()] = c.id;
    });

    for (const row of data) {
      try {
        const customerName = String(row.customer_name || "").toLowerCase().trim();
        const clientId = clientLookup[customerName] || null;

        if (!clientId) {
          console.warn(`Client not found: ${row.customer_name}`);
        }

        const { error } = await supabase.from("invoices").insert({
          invoice_number: String(row.invoice_number || "").trim(),
          client_id: clientId,
          date_issued: row.date_issued ? String(row.date_issued) : new Date().toISOString().split('T')[0],
          due_date: row.due_date ? String(row.due_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          total_amount: typeof row.total_amount === 'number' ? row.total_amount : parseFloat(String(row.total_amount)) || 0,
          status: String(row.status || "PENDING").toUpperCase(),
          notes: row.notes ? String(row.notes) : null,
        });

        if (error) {
          console.error("Import error:", error);
          failed++;
        } else {
          success++;
        }
      } catch (err) {
        console.error("Import error:", err);
        failed++;
      }
    }

    fetchInvoices();
    return { success, failed };
  };

  const importTargetFields = [
    { field: "invoice_number", label: "Invoice Number", required: true },
    { field: "customer_name", label: "Customer Name", required: true },
    { field: "date_issued", label: "Invoice Date", required: false },
    { field: "due_date", label: "Due Date", required: false },
    { field: "total_amount", label: "Total Amount", required: false },
    { field: "status", label: "Status", required: false },
    { field: "notes", label: "Notes", required: false },
  ];

  const topbarButtons = (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
        <Upload className="h-4 w-4 mr-1" /> Import
      </Button>
      <Button 
        className="bg-books-blue hover:bg-blue-700"
        onClick={() => navigate("/sales/invoices/new")}
      >
        <Plus className="h-4 w-4 mr-1" /> New
      </Button>
    </div>
  );

  return (
    <MainLayout title="Invoices" searchPlaceholder="Search invoices" topbarButtons={topbarButtons}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">All Invoices</h1>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-books-light-blue flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-books-blue" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Outstanding Receivables</p>
                    <p className="text-lg font-bold">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                      }).format(summary.totalReceivables)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Due Today</p>
                <p className="text-lg font-bold text-books-yellow">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(summary.dueToday)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Due Within 30 Days</p>
                <p className="text-lg font-bold text-books-yellow">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(summary.dueThirtyDays)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Overdue Invoices</p>
                <p className="text-lg font-bold text-books-red">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(summary.overdue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          <DataTable 
            columns={columns} 
            data={invoices} 
            isLoading={loading} 
          />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice ${invoiceToDelete?.invoice_number}? This action cannot be undone.`}
        onConfirm={handleDeleteInvoice}
        confirmLabel="Delete"
        variant="destructive"
      />

      {/* Send Invoice Dialog */}
      {invoiceToSend && (
        <SendInvoiceDialog
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
          invoiceId={invoiceToSend.id}
          invoiceNumber={invoiceToSend.invoice_number}
          clientEmail={invoiceToSend.client_email}
          clientName={invoiceToSend.client_name}
        />
      )}

      {/* Import Dialog */}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="Import Invoices"
        description="Import invoices from a CSV or Excel file. Make sure customers exist before importing. Customer names must match exactly."
        targetFields={importTargetFields}
        zohoFieldConfig={ZOHO_FIELD_MAPPINGS.invoices}
        onImport={handleImport}
      />
    </MainLayout>
  );
};

export default Invoices;
