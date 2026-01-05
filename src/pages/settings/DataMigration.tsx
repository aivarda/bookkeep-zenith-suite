import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Package,
  FileText,
  Building2,
  CheckCircle2,
  Circle,
  ArrowRight,
  Download,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ImportDialog } from "@/components/import/ImportDialog";
import { ZOHO_FIELD_MAPPINGS, exportToCSV } from "@/lib/import-utils";

interface MigrationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  table: string;
  completed: boolean;
  count: number;
}

const DataMigration = () => {
  const [steps, setSteps] = useState<MigrationStep[]>([
    {
      id: "clients",
      title: "Customers",
      description: "Import your customer data from Zoho Books",
      icon: <Users className="h-5 w-5" />,
      table: "clients",
      completed: false,
      count: 0,
    },
    {
      id: "vendors",
      title: "Vendors",
      description: "Import your vendor/supplier data",
      icon: <Building2 className="h-5 w-5" />,
      table: "vendors",
      completed: false,
      count: 0,
    },
    {
      id: "items",
      title: "Items & Products",
      description: "Import your products and services catalog",
      icon: <Package className="h-5 w-5" />,
      table: "items",
      completed: false,
      count: 0,
    },
  ]);

  const [activeImport, setActiveImport] = useState<string | null>(null);

  const getTargetFields = (moduleId: string) => {
    const fieldMap: Record<string, { field: string; label: string; required: boolean }[]> = {
      clients: [
        { field: "name", label: "Customer Name", required: true },
        { field: "email", label: "Email", required: false },
        { field: "phone", label: "Phone", required: false },
        { field: "address", label: "Address", required: false },
        { field: "gstin", label: "GSTIN", required: false },
      ],
      vendors: [
        { field: "name", label: "Vendor Name", required: true },
        { field: "email", label: "Email", required: false },
        { field: "phone", label: "Phone", required: false },
        { field: "address", label: "Address", required: false },
        { field: "gstin", label: "GSTIN", required: false },
      ],
      items: [
        { field: "name", label: "Item Name", required: true },
        { field: "sku", label: "SKU", required: false },
        { field: "rate", label: "Rate", required: false },
        { field: "description", label: "Description", required: false },
        { field: "type", label: "Type (goods/service)", required: false },
        { field: "taxable", label: "Taxable", required: false },
      ],
    };
    return fieldMap[moduleId] || [];
  };

  const getZohoConfig = (moduleId: string) => {
    return ZOHO_FIELD_MAPPINGS[moduleId as keyof typeof ZOHO_FIELD_MAPPINGS];
  };

  const handleImport = async (moduleId: string, data: Record<string, unknown>[]) => {
    const step = steps.find((s) => s.id === moduleId);
    if (!step) return { success: 0, failed: 0 };

    let success = 0;
    let failed = 0;

    // Process in batches of 50
    const batchSize = 50;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      try {
        const insertData = batch.map((row) => {
          const record: Record<string, unknown> = {};
          
          if (moduleId === "clients" || moduleId === "vendors") {
            record.name = String(row.name || "").trim();
            record.email = row.email ? String(row.email).trim() : null;
            record.phone = row.phone ? String(row.phone).trim() : null;
            record.address = row.address ? String(row.address).trim() : null;
            record.gstin = row.gstin ? String(row.gstin).trim().toUpperCase() : null;
          } else if (moduleId === "items") {
            record.name = String(row.name || "").trim();
            record.sku = row.sku ? String(row.sku).trim() : null;
            record.rate = typeof row.rate === "number" ? row.rate : parseFloat(String(row.rate)) || 0;
            record.description = row.description ? String(row.description).trim() : null;
            record.type = row.type === "service" ? "service" : "goods";
            record.taxable = row.taxable === true || row.taxable === "true" || row.taxable === "Yes";
          }
          
          return record;
        });

        const { error } = await supabase.from(step.table as 'clients' | 'vendors' | 'items').insert(insertData as any);

        if (error) {
          console.error(`Batch insert error:`, error);
          failed += batch.length;
        } else {
          success += batch.length;
        }
      } catch (error) {
        console.error(`Batch error:`, error);
        failed += batch.length;
      }
    }

    // Update step status
    setSteps((prev) =>
      prev.map((s) =>
        s.id === moduleId
          ? { ...s, completed: success > 0, count: s.count + success }
          : s
      )
    );

    return { success, failed };
  };

  const downloadSampleCSV = (moduleId: string) => {
    const sampleData: Record<string, Record<string, string>[]> = {
      clients: [
        { "Customer Name": "Acme Corp", "Email": "contact@acme.com", "Phone": "9876543210", "Address": "123 Main St, Mumbai", "GSTIN": "27AABCU9603R1ZM" },
        { "Customer Name": "Beta Industries", "Email": "info@beta.in", "Phone": "9123456789", "Address": "456 Park Ave, Delhi", "GSTIN": "" },
      ],
      vendors: [
        { "Vendor Name": "Supply Co", "Email": "sales@supply.com", "Phone": "9876543210", "Address": "789 Industrial Area", "GSTIN": "29AABCS1429B1Z9" },
        { "Vendor Name": "Parts Ltd", "Email": "orders@parts.in", "Phone": "9123456789", "Address": "101 Factory Lane", "GSTIN": "" },
      ],
      items: [
        { "Item Name": "Widget A", "SKU": "WGT-001", "Rate": "1500", "Description": "Standard widget", "Product Type": "goods", "Is Taxable": "Yes" },
        { "Item Name": "Consulting Service", "SKU": "SVC-001", "Rate": "5000", "Description": "Per hour consulting", "Product Type": "service", "Is Taxable": "Yes" },
      ],
    };

    exportToCSV(sampleData[moduleId] || [], `${moduleId}_sample_template`);
    toast.success("Sample template downloaded");
  };

  const completedSteps = steps.filter((s) => s.completed).length;
  const progressPercent = (completedSteps / steps.length) * 100;

  return (
    <MainLayout title="Data Migration">
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold">Migrate from Zoho Books</h1>
          <p className="text-muted-foreground mt-1">
            Import your existing data from Zoho Books or any CSV/Excel file
          </p>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Migration Progress</CardTitle>
            <CardDescription>
              {completedSteps} of {steps.length} modules imported
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercent} className="h-2" />
          </CardContent>
        </Card>

        {/* Migration Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <Card key={step.id} className={step.completed ? "border-green-500/50" : ""}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${step.completed ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"}`}>
                    {step.completed ? <CheckCircle2 className="h-5 w-5" /> : step.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{step.title}</h3>
                      {step.completed && (
                        <Badge variant="default" className="bg-green-600">
                          {step.count} imported
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {step.description}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadSampleCSV(step.id)}
                      >
                        <Download className="h-4 w-4 mr-1" /> Sample CSV
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setActiveImport(step.id)}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        {step.completed ? "Import More" : "Import"}
                      </Button>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How to Export from Zoho Books</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Log in to your <strong>Zoho Books</strong> account</li>
              <li>Navigate to the module you want to export (Customers, Vendors, or Items)</li>
              <li>Click the <strong>hamburger menu (⋮)</strong> in the top-right corner</li>
              <li>Select <strong>"Export"</strong> from the dropdown</li>
              <li>Choose <strong>CSV</strong> or <strong>Excel</strong> format</li>
              <li>Download the file and upload it here</li>
            </ol>
            
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <strong>Tip:</strong> We automatically detect and map common Zoho Books column names. 
              You can also manually adjust the mapping if needed.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Dialogs */}
      {steps.map((step) => (
        <ImportDialog
          key={step.id}
          open={activeImport === step.id}
          onOpenChange={(open) => !open && setActiveImport(null)}
          title={`Import ${step.title}`}
          description={step.description}
          targetFields={getTargetFields(step.id)}
          zohoFieldConfig={getZohoConfig(step.id)}
          onImport={(data) => handleImport(step.id, data)}
        />
      ))}
    </MainLayout>
  );
};

export default DataMigration;
