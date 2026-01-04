import { forwardRef } from "react";

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  tax_percent: number;
  total: number;
}

interface InvoicePDFProps {
  invoice: {
    invoice_number: string;
    date_issued: string;
    due_date: string;
    status: string;
    notes?: string;
    total_amount: number;
  };
  client: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    gstin?: string;
  } | null;
  items: InvoiceItem[];
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyGstin?: string;
  companyLogoUrl?: string;
}

const InvoicePDF = forwardRef<HTMLDivElement, InvoicePDFProps>(
  ({ invoice, client, items, companyName = "Your Company", companyAddress, companyPhone, companyEmail, companyGstin, companyLogoUrl }, ref) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const totalTax = items.reduce((sum, item) => sum + ((item.quantity * item.rate) * (item.tax_percent / 100)), 0);

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount);
    };

    return (
      <div
        ref={ref}
        className="bg-white p-8 max-w-[210mm] mx-auto"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b pb-6">
          <div className="flex items-start gap-4">
            {companyLogoUrl && (
              <img 
                src={companyLogoUrl} 
                alt="Company Logo" 
                className="h-16 w-16 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{companyName}</h1>
              {companyAddress && <p className="text-gray-600 mt-1">{companyAddress}</p>}
              {companyPhone && <p className="text-gray-600">{companyPhone}</p>}
              {companyEmail && <p className="text-gray-600">{companyEmail}</p>}
              {companyGstin && <p className="text-gray-600">GSTIN: {companyGstin}</p>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-blue-600">INVOICE</h2>
            <p className="text-gray-600 mt-2">
              <span className="font-semibold">Invoice #:</span> {invoice.invoice_number}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Date:</span> {new Date(invoice.date_issued).toLocaleDateString("en-IN")}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Due Date:</span> {new Date(invoice.due_date).toLocaleDateString("en-IN")}
            </p>
            <span
              className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                invoice.status === "PAID"
                  ? "bg-green-100 text-green-800"
                  : invoice.status === "OVERDUE"
                  ? "bg-red-100 text-red-800"
                  : invoice.status === "PENDING"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {invoice.status}
            </span>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8">
          <h3 className="text-gray-500 font-semibold mb-2">BILL TO:</h3>
          {client ? (
            <div>
              <p className="font-bold text-gray-800 text-lg">{client.name}</p>
              {client.address && <p className="text-gray-600">{client.address}</p>}
              {client.email && <p className="text-gray-600">{client.email}</p>}
              {client.phone && <p className="text-gray-600">{client.phone}</p>}
              {client.gstin && <p className="text-gray-600">GSTIN: {client.gstin}</p>}
            </div>
          ) : (
            <p className="text-gray-500">No client information</p>
          )}
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-3 text-left font-semibold text-gray-700">#</th>
                <th className="border border-gray-300 p-3 text-left font-semibold text-gray-700">Description</th>
                <th className="border border-gray-300 p-3 text-right font-semibold text-gray-700">Qty</th>
                <th className="border border-gray-300 p-3 text-right font-semibold text-gray-700">Rate</th>
                <th className="border border-gray-300 p-3 text-right font-semibold text-gray-700">Tax %</th>
                <th className="border border-gray-300 p-3 text-right font-semibold text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border border-gray-300 p-3">{index + 1}</td>
                  <td className="border border-gray-300 p-3">{item.description}</td>
                  <td className="border border-gray-300 p-3 text-right">{item.quantity}</td>
                  <td className="border border-gray-300 p-3 text-right">{formatCurrency(item.rate)}</td>
                  <td className="border border-gray-300 p-3 text-right">{item.tax_percent}%</td>
                  <td className="border border-gray-300 p-3 text-right">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium">{formatCurrency(totalTax)}</span>
            </div>
            <div className="flex justify-between py-3 text-lg font-bold">
              <span>Total:</span>
              <span className="text-blue-600">{formatCurrency(invoice.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="border-t pt-4">
            <h3 className="text-gray-500 font-semibold mb-2">NOTES:</h3>
            <p className="text-gray-600">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center text-gray-500 text-sm">
          <p>Thank you for your business!</p>
        </div>
      </div>
    );
  }
);

InvoicePDF.displayName = "InvoicePDF";

export default InvoicePDF;
