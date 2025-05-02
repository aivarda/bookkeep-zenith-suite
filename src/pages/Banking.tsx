
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ArrowUpRight, CreditCard, Wallet, Landmark, PiggyBank } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

interface Account {
  id: string;
  name: string;
  type: string;
  bankBalance: number;
  booksBalance: number;
}

// Placeholder data
const accounts: Account[] = [
  { id: "1", name: "IA_BANK", type: "Bank", bankBalance: 0, booksBalance: 356767.02 },
  { id: "2", name: "Amazon Receivable", type: "Uncategorized", bankBalance: 0, booksBalance: 15576.16 },
  { id: "3", name: "Petty Cash", type: "Cash", bankBalance: 0, booksBalance: 3802.00 },
  { id: "4", name: "Razorpay Receivable", type: "Uncategorized", bankBalance: 0, booksBalance: 0 },
  { id: "5", name: "Undeposited Funds", type: "Cash", bankBalance: 0, booksBalance: 36652.08 },
];

const Banking = () => {
  const columns: ColumnDef<Account>[] = [
    {
      accessorKey: "name",
      header: "Account Details",
      cell: ({ row }) => {
        const account = row.original;
        const getIcon = () => {
          switch(account.type) {
            case "Bank": return <Landmark className="h-4 w-4 text-books-blue" />;
            case "Cash": return <Wallet className="h-4 w-4 text-books-green" />;
            default: return <PiggyBank className="h-4 w-4 text-books-yellow" />;
          }
        };
        
        return (
          <div className="flex items-center gap-2">
            <div className="bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center">
              {getIcon()}
            </div>
            <span>{account.name}</span>
          </div>
        );
      }
    },
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "bankBalance",
      header: "Amount in Bank",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("bankBalance"));
        const formatted = new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(amount);
        return <div>{formatted}</div>;
      },
    },
    {
      accessorKey: "booksBalance",
      header: "Amount in Books",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("booksBalance"));
        const formatted = new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(amount);
        return <div className="font-medium">{formatted}</div>;
      },
    },
  ];

  const topbarButtons = (
    <>
      <Button variant="outline" className="mr-2">
        Import Statement
      </Button>
      <Button className="bg-books-blue hover:bg-blue-700">
        <Plus className="h-4 w-4 mr-1" /> Add Bank
      </Button>
    </>
  );

  return (
    <MainLayout title="Banking" searchPlaceholder="Search in Banking" topbarButtons={topbarButtons}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Banking Overview</h1>
        
        <Card className="border-l-4 border-l-books-blue bg-books-light-blue/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-white rounded-full p-2">
              <ArrowUpRight className="w-5 h-5 text-books-blue" />
            </div>
            <div>
              <h3 className="font-medium">Auto-upload bank statements from email</h3>
              <div className="flex items-center gap-6 mt-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-books-navy"></div>
                  <span>Enable Auto-upload</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-books-navy"></div>
                  <span>Set up Auto-forwarding</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-books-navy"></div>
                  <span>Add Statements to Bank</span>
                </div>
              </div>
            </div>
            <Button size="sm" className="ml-auto bg-books-blue hover:bg-blue-700">
              Set up Now
            </Button>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="data-card">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-5 w-5 text-books-text" />
              <span className="font-medium text-sm text-books-text">Cash In Hand</span>
            </div>
            <div className="text-xl font-bold text-books-red">-₹40,454.08</div>
          </div>
          
          <div className="data-card">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="h-5 w-5 text-books-text" />
              <span className="font-medium text-sm text-books-text">Payment Clearing</span>
            </div>
            <div className="text-xl font-bold text-books-red">-₹15,576.16</div>
          </div>
          
          <div className="data-card">
            <div className="flex items-center gap-2 mb-2">
              <Landmark className="h-5 w-5 text-books-text" />
              <span className="font-medium text-sm text-books-text">Bank Balance</span>
            </div>
            <div className="text-xl font-bold">₹3,56,767.02</div>
          </div>
          
          <div className="data-card">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-5 w-5 text-books-text" />
              <span className="font-medium text-sm text-books-text">Card Balance</span>
            </div>
            <div className="text-xl font-bold">₹7,181.11</div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Active Accounts</h2>
            <select className="text-sm border rounded px-2 py-1">
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>This year</option>
            </select>
          </div>
          
          <DataTable columns={columns} data={accounts} />
        </div>
      </div>
    </MainLayout>
  );
};

export default Banking;
