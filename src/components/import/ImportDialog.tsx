import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import {
  parseImportFile,
  autoDetectMappings,
  transformData,
  validateImportData,
  FieldMapping,
  ZohoFieldConfig,
} from "@/lib/import-utils";
import { FieldMapper } from "./FieldMapper";

interface TargetField {
  field: string;
  label: string;
  required: boolean;
}

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  targetFields: TargetField[];
  zohoFieldConfig?: ZohoFieldConfig[];
  onImport: (data: Record<string, unknown>[]) => Promise<{ success: number; failed: number }>;
}

type ImportStep = "upload" | "mapping" | "preview" | "importing" | "complete";

export const ImportDialog = ({
  open,
  onOpenChange,
  title,
  description,
  targetFields,
  zohoFieldConfig,
  onImport,
}: ImportDialogProps) => {
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<Record<string, unknown>[]>([]);
  const [sourceColumns, setSourceColumns] = useState<string[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [transformedData, setTransformedData] = useState<Record<string, unknown>[]>([]);
  const [validationErrors, setValidationErrors] = useState<{ row: number; message: string }[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const reset = () => {
    setStep("upload");
    setFile(null);
    setRawData([]);
    setSourceColumns([]);
    setMappings([]);
    setTransformedData([]);
    setValidationErrors([]);
    setImportProgress(0);
    setImportResult(null);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleFileDrop = useCallback(async (acceptedFile: File) => {
    setFile(acceptedFile);
    
    const result = await parseImportFile(acceptedFile);
    
    if (!result.success || !result.data) {
      toast.error(result.errors?.[0] || "Failed to parse file");
      return;
    }
    
    if (result.data.length === 0) {
      toast.error("File is empty");
      return;
    }
    
    setRawData(result.data);
    
    // Extract column names from first row
    const columns = Object.keys(result.data[0]);
    setSourceColumns(columns);
    
    // Auto-detect mappings
    const detectedMappings = autoDetectMappings(columns, targetFields);
    setMappings(detectedMappings);
    
    setStep("mapping");
    toast.success(`Loaded ${result.data.length} rows from file`);
  }, [targetFields]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      await handleFileDrop(droppedFile);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await handleFileDrop(selectedFile);
    }
  };

  const handleProceedToPreview = () => {
    const requiredFields = targetFields.filter((f) => f.required).map((f) => f.field);
    const allRequiredMapped = requiredFields.every((field) =>
      mappings.some((m) => m.targetField === field)
    );
    
    if (!allRequiredMapped) {
      toast.error("Please map all required fields");
      return;
    }
    
    // Transform data
    const transformed = transformData(rawData, mappings, zohoFieldConfig);
    
    // Validate
    const { valid, errors } = validateImportData(transformed, requiredFields);
    
    setTransformedData(valid);
    setValidationErrors(errors);
    setStep("preview");
  };

  const handleImport = async () => {
    if (transformedData.length === 0) {
      toast.error("No valid data to import");
      return;
    }
    
    setStep("importing");
    setImportProgress(10);
    
    try {
      const result = await onImport(transformedData);
      setImportProgress(100);
      setImportResult(result);
      setStep("complete");
      
      if (result.success > 0) {
        toast.success(`Successfully imported ${result.success} records`);
      }
      if (result.failed > 0) {
        toast.error(`Failed to import ${result.failed} records`);
      }
    } catch (error) {
      toast.error("Import failed: " + (error as Error).message);
      setStep("preview");
    }
  };

  const renderUploadStep = () => (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">
          Drag and drop your file here
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Supports CSV, XLS, and XLSX files
        </p>
        <label>
          <input
            type="file"
            className="hidden"
            accept=".csv,.xls,.xlsx"
            onChange={handleFileSelect}
          />
          <Button variant="outline" asChild>
            <span>Browse Files</span>
          </Button>
        </label>
      </div>
      
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Zoho Books Export Instructions
        </h4>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Log in to your Zoho Books account</li>
          <li>Go to the module you want to export (e.g., Customers, Items)</li>
          <li>Click the hamburger menu (⋮) and select "Export"</li>
          <li>Choose CSV or Excel format and download</li>
          <li>Upload the downloaded file here</li>
        </ol>
      </div>
    </div>
  );

  const renderMappingStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{file?.name}</span>
          <Badge variant="secondary">{rawData.length} rows</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>
          <X className="h-4 w-4 mr-1" /> Change file
        </Button>
      </div>
      
      <FieldMapper
        sourceColumns={sourceColumns}
        targetFields={targetFields}
        mappings={mappings}
        onMappingChange={setMappings}
      />
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="font-medium">{transformedData.length} valid records</span>
        </div>
        {validationErrors.length > 0 && (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            {validationErrors.length} errors (will be skipped)
          </Badge>
        )}
      </div>
      
      <ScrollArea className="h-[300px] border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {targetFields.slice(0, 5).map((field) => (
                <TableHead key={field.field}>{field.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transformedData.slice(0, 10).map((row, idx) => (
              <TableRow key={idx}>
                {targetFields.slice(0, 5).map((field) => (
                  <TableCell key={field.field} className="max-w-[150px] truncate">
                    {String(row[field.field] || "-")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {transformedData.length > 10 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  ... and {transformedData.length - 10} more rows
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
      
      {validationErrors.length > 0 && (
        <div className="bg-destructive/10 rounded-lg p-4">
          <h4 className="font-medium text-destructive mb-2">Validation Errors</h4>
          <ul className="text-sm space-y-1">
            {validationErrors.slice(0, 5).map((error, idx) => (
              <li key={idx}>Row {error.row}: {error.message}</li>
            ))}
            {validationErrors.length > 5 && (
              <li className="text-muted-foreground">
                ... and {validationErrors.length - 5} more errors
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );

  const renderImportingStep = () => (
    <div className="space-y-4 py-8">
      <div className="text-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-lg font-medium">Importing data...</p>
        <p className="text-sm text-muted-foreground">
          Please wait while we import your records
        </p>
      </div>
      <Progress value={importProgress} className="w-full" />
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-4 py-8 text-center">
      <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
      <div>
        <p className="text-lg font-medium">Import Complete!</p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <Badge variant="default" className="bg-green-600">
            {importResult?.success} imported
          </Badge>
          {(importResult?.failed || 0) > 0 && (
            <Badge variant="destructive">
              {importResult?.failed} failed
            </Badge>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        {step === "upload" && renderUploadStep()}
        {step === "mapping" && renderMappingStep()}
        {step === "preview" && renderPreviewStep()}
        {step === "importing" && renderImportingStep()}
        {step === "complete" && renderCompleteStep()}
        
        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
          
          {step === "mapping" && (
            <>
              <Button variant="outline" onClick={reset}>
                Back
              </Button>
              <Button onClick={handleProceedToPreview}>
                Continue
              </Button>
            </>
          )}
          
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("mapping")}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={transformedData.length === 0}>
                Import {transformedData.length} Records
              </Button>
            </>
          )}
          
          {step === "complete" && (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
