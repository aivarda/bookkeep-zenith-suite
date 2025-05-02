
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ShoppingBag } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

interface Purchase {
  id: string;
  date: string;
  billNum: string;
  vendor: string;
  status: "PAID" | "PENDING" | "OVERDUE";
  dueDate: string;
  amount: number;
  balanceDue: number;
}

// Placeholder data
const purchases: Purchase[] = [
  { id: "1", date: "05/05/2025", billNum: "BILL-000025", vendor: "AXIS BANK LIMITED", status: "PENDING", dueDate: "20/05/2025", amount: 15000.00, balanceDue: 15000.00 },
  { id: "2", date: "01/05/2025", billNum: "BILL-000024", vendor: "AMC Oil trade", status: "PAID", dueDate: "15/05/2025", amount: 7500.00, balanceDue: 0.00 },
  { id: "3", date: "28/04/2025", billNum: "BILL-000023", vendor: "CITRODA", status: "PAID", dueDate: "12/05/2025", amount: 4300.00, balanceDue: 0.00 },
];

const Purchases = () => {
  const columns: ColumnDef<Purchase>[] = [
    {
      accessorKey: "date",
      header: "Date",
    },
    {
      accessorKey: "billNum",
      header: "Bill#",
      cell: ({ row }) => (
        <span className="text-books-blue">{row.getValue("billNum")}</span>
      ),
    },
    {
      accessorKey: "vendor",
      header: "Vendor Name",
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
              : status === "PENDING" 
                ? "text-books-yellow" 
                : "text-books-red"
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
      <Plus className="h-4 w-4 mr-1" /> New Bill
    </Button>
  );

  return (
    <MainLayout title="Purchases" searchPlaceholder="Search in Bills" topbarButtons={topbarButtons}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">All Bills</h1>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-books-light-blue flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-books-blue" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Outstanding Payables</p>
                    <p className="text-lg font-bold">₹15,000.00</p>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Due Today</p>
                <p className="text-lg font-bold text-books-yellow">₹0.00</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Due Within 30 Days</p>
                <p className="text-lg font-bold text-books-yellow">₹15,000.00</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Overdue Bills</p>
                <p className="text-lg font-bold text-books-red">₹0.00</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          <DataTable columns={columns} data={purchases} />
        </div>
      </div>
    </MainLayout>
  );
};

export default Purchases;
