
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

interface Item {
  id: string;
  name: string;
  type: string;
  unit: string;
  sellingPrice: number;
  purchasePrice: number;
  stock: number;
}

// Placeholder data
const items: Item[] = [
  { id: "1", name: "Laptop", type: "Goods", unit: "Pcs", sellingPrice: 75000, purchasePrice: 65000, stock: 10 },
  { id: "2", name: "Mouse", type: "Goods", unit: "Pcs", sellingPrice: 1200, purchasePrice: 900, stock: 25 },
  { id: "3", name: "Keyboard", type: "Goods", unit: "Pcs", sellingPrice: 2500, purchasePrice: 1800, stock: 15 },
  { id: "4", name: "Monitor", type: "Goods", unit: "Pcs", sellingPrice: 15000, purchasePrice: 12000, stock: 8 },
  { id: "5", name: "Web Design", type: "Service", unit: "Hour", sellingPrice: 1000, purchasePrice: 0, stock: 0 },
];

const Items = () => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const columns: ColumnDef<Item>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "unit",
      header: "Unit",
    },
    {
      accessorKey: "sellingPrice",
      header: "Selling Price",
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("sellingPrice"));
        const formatted = new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(price);
        return <div>{formatted}</div>;
      },
    },
    {
      accessorKey: "purchasePrice",
      header: "Purchase Price",
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("purchasePrice"));
        const formatted = new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(price);
        return <div>{formatted}</div>;
      },
    },
    {
      accessorKey: "stock",
      header: "Stock",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setSelectedItem(item)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-books-red">
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const topbarButtons = (
    <Button className="bg-books-blue hover:bg-blue-700">
      <Plus className="h-4 w-4 mr-1" /> Add Item
    </Button>
  );

  return (
    <MainLayout title="Items" searchPlaceholder="Search items" topbarButtons={topbarButtons}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">All Items</h1>
        </div>
        
        <div>
          <DataTable columns={columns} data={items} />
        </div>
      </div>
    </MainLayout>
  );
};

export default Items;
