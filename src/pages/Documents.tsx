
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, File, Download, Eye, Trash } from "lucide-react";

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedDate: string;
}

// Placeholder data
const documents: Document[] = [
  { id: "1", name: "Invoice_April_2025.pdf", type: "PDF", size: "256 KB", uploadedBy: "Admin", uploadedDate: "01 May, 2025" },
  { id: "2", name: "GST_Filing_Q1_2025.xlsx", type: "Excel", size: "1.2 MB", uploadedBy: "Admin", uploadedDate: "15 Apr, 2025" },
  { id: "3", name: "Bank_Statement_Apr_2025.pdf", type: "PDF", size: "512 KB", uploadedBy: "Admin", uploadedDate: "02 May, 2025" },
  { id: "4", name: "Financial_Report_2024-25.docx", type: "Word", size: "845 KB", uploadedBy: "Admin", uploadedDate: "10 Apr, 2025" },
];

const Documents = () => {
  const columns: ColumnDef<Document>[] = [
    {
      accessorKey: "name",
      header: "Document Name",
      cell: ({ row }) => {
        const doc = row.original;
        const getIcon = () => {
          switch(doc.type) {
            case "PDF": return <File className="h-4 w-4 text-books-red" />;
            case "Excel": return <File className="h-4 w-4 text-books-green" />;
            case "Word": return <File className="h-4 w-4 text-books-blue" />;
            default: return <File className="h-4 w-4" />;
          }
        };
        
        return (
          <div className="flex items-center gap-2">
            {getIcon()}
            <span>{doc.name}</span>
          </div>
        );
      }
    },
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "size",
      header: "Size",
    },
    {
      accessorKey: "uploadedBy",
      header: "Uploaded By",
    },
    {
      accessorKey: "uploadedDate",
      header: "Date",
    },
    {
      id: "actions",
      header: "Actions",
      cell: () => {
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Eye className="h-4 w-4" />
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
      <Plus className="h-4 w-4 mr-1" /> Upload Document
    </Button>
  );

  return (
    <MainLayout title="Documents" searchPlaceholder="Search documents" topbarButtons={topbarButtons}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Documents</h1>
        </div>
        
        <Card>
          <div className="p-6">
            <DataTable columns={columns} data={documents} />
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Documents;
