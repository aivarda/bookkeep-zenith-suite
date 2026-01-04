import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Printer, Mail, Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import InvoicePDF from "@/components/invoice/InvoicePDF";
import SendInvoiceDialog from "@/components/invoice/SendInvoiceDialog";

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  tax_percent: number;
  total: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  date_issued: string;
  due_date: string;
  status: string;
  notes: string | null;
  total_amount: number;
  client_id: string | null;
}

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  gstin: string | null;
}
interface CompanySettings {
  company_name: string;
  address: string | null;
  gstin: string | null;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
}

const InvoiceView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInvoiceData(id);
    }
  }, [id]);

  const fetchInvoiceData = async (invoiceId: string) => {
    setLoading(true);
    try {
      // Fetch invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();

      if (invoiceError) throw invoiceError;
      setInvoice(invoiceData);

      // Fetch client if exists
      if (invoiceData.client_id) {
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("*")
          .eq("id", invoiceData.client_id)
          .single();

        if (!clientError) {
          setClient(clientData);
        }
      }

      // Fetch invoice items
      const { data: itemsData, error: itemsError } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoiceId);

      if (!itemsError) {
        setItems(itemsData || []);
      }

      // Fetch company settings
      const { data: companyData } = await supabase
        .from("company_settings")
        .select("*")
        .limit(1)
        .single();

      if (companyData) {
        setCompanySettings(companyData);
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      toast.error("Could not load invoice");
      navigate("/sales/invoices");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = invoiceRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print the invoice");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice?.invoice_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
            ${document.querySelector('style')?.textContent || ''}
          </style>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 250);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <MainLayout title="Invoice" showSearch={false}>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!invoice) {
    return (
      <MainLayout title="Invoice" showSearch={false}>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Invoice not found</p>
          <Button variant="outline" onClick={() => navigate("/sales/invoices")} className="mt-4">
            Back to Invoices
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Invoice" showSearch={false}>
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/sales/invoices")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Invoice {invoice.invoice_number}</h1>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/sales/invoices/${id}`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print / PDF
            </Button>
            <Button onClick={() => setSendDialogOpen(true)}>
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </div>
        </div>

        {/* Invoice Preview */}
        <Card>
          <CardContent className="p-0 overflow-auto">
            <InvoicePDF
              ref={invoiceRef}
              invoice={{
                invoice_number: invoice.invoice_number,
                date_issued: invoice.date_issued,
                due_date: invoice.due_date,
                status: invoice.status,
                notes: invoice.notes || undefined,
                total_amount: invoice.total_amount,
              }}
              client={client ? {
                name: client.name,
                email: client.email || undefined,
                phone: client.phone || undefined,
                address: client.address || undefined,
                gstin: client.gstin || undefined,
              } : null}
              items={items}
              companyName={companySettings?.company_name}
              companyAddress={companySettings?.address || undefined}
              companyPhone={companySettings?.phone || undefined}
              companyEmail={companySettings?.email || undefined}
              companyGstin={companySettings?.gstin || undefined}
              companyLogoUrl={companySettings?.logo_url || undefined}
            />
          </CardContent>
        </Card>
      </div>

      {/* Send Invoice Dialog */}
      <SendInvoiceDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        invoiceId={invoice.id}
        invoiceNumber={invoice.invoice_number}
        clientEmail={client?.email || ""}
        clientName={client?.name || ""}
      />
    </MainLayout>
  );
};

export default InvoiceView;
