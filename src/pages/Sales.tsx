
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, DollarSign } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

interface Invoice {
  id: string;
  date: string;
  invoiceNum: string;
  orderNumber: string;
  customer: string;
  status: "DRAFT" | "PAID" | "PENDING";
  dueDate: string;
  amount: number;
  balanceDue: number;
}

// Placeholder data
const invoices: Invoice[] = [
  { id: "1", date: "01/05/2025", invoiceNum: "IAFIRM-000068", orderNumber: "JCEP094068", customer: "Scootsy Logistics Private Limited", status: "DRAFT", dueDate: "16/05/2025", amount: 10500.00, balanceDue: 10500.00 },
  { id: "2", date: "01/05/2025", invoiceNum: "IAFIRM-000067", orderNumber: "JCEP093300", customer: "Scootsy Logistics Private Limited", status: "DRAFT", dueDate: "16/05/2025", amount: 10500.00, balanceDue: 10500.00 },
  { id: "3", date: "30/04/2025", invoiceNum: "IAPOS2025-0094", orderNumber: "#10094", customer: "R Srinivasan", status: "PAID", dueDate: "30/04/2025", amount: 435.00, balanceDue: 0.00 },
  { id: "4", date: "27/04/2025", invoiceNum: "IAPOS2025-0093", orderNumber: "#10093", customer: "V Jayaraman", status: "PAID", dueDate: "27/04/2025", amount: 622.00, balanceDue: 0.00 },
  { id: "5", date: "24/04/2025", invoiceNum: "IAFIRM-000066", orderNumber: "", customer: "SHREE PACHAIAMMAN FOODS", status: "PAID", dueDate: "24/04/2025", amount: 8550.00, balanceDue: 0.00 },
];

const Sales = () => {
  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: "date",
      header: "Date",
    },
    {
      accessorKey: "invoiceNum",
      header: "Invoice#",
      cell: ({ row }) => (
        <span className="text-books-blue">{row.getValue("invoiceNum")}</span>
      ),
    },
    {
      accessorKey: "orderNumber",
      header: "Order Number",
    },
    {
      accessorKey: "customer",
      header: "Customer Name",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status");
        return (
          <span className={
            status === "PAID" 
              ? "text-books-green" 
              : status === "DRAFT" 
                ? "text-gray-500" 
                : "text-books-yellow"
          }>
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        const formatted = new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(amount);
        return <div>{formatted}</div>;
      },
    },
    {
      accessorKey: "balanceDue",
      header: "Balance Due",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("balanceDue"));
        const formatted = new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(amount);
        return <div>{formatted}</div>;
      },
    },
  ];

  const topbarButtons = (
    <Button className="bg-books-blue hover:bg-blue-700">
      <Plus className="h-4 w-4 mr-1" /> New
    </Button>
  );

  return (
    <MainLayout title="Sales" searchPlaceholder="Search in Invoices" topbarButtons={topbarButtons}>
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
                    <p className="text-lg font-bold">₹10,500.00</p>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Due Today</p>
                <p className="text-lg font-bold text-books-yellow">₹0.00</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Due Within 30 Days</p>
                <p className="text-lg font-bold text-books-yellow">₹0.00</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Overdue Invoice</p>
                <p className="text-lg font-bold text-books-red">₹10,500.00</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          <DataTable columns={columns} data={invoices} />
        </div>
      </div>
    </MainLayout>
  );
};

export default Sales;
