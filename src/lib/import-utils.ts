import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ImportResult {
  success: boolean;
  data?: Record<string, unknown>[];
  errors?: string[];
  totalRows?: number;
  successCount?: number;
  errorCount?: number;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
}

export interface ZohoFieldConfig {
  zohoFields: string[];
  targetField: string;
  required: boolean;
  transform?: (value: unknown) => unknown;
}

// Parse CSV file
export const parseCSVFile = (file: File): Promise<ImportResult> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          resolve({
            success: false,
            errors: results.errors.map(e => e.message),
          });
        } else {
          resolve({
            success: true,
            data: results.data as Record<string, unknown>[],
            totalRows: results.data.length,
          });
        }
      },
      error: (error) => {
        resolve({
          success: false,
          errors: [error.message],
        });
      },
    });
  });
};

// Parse Excel file (XLS/XLSX)
export const parseExcelFile = (file: File): Promise<ImportResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
        
        resolve({
          success: true,
          data: jsonData,
          totalRows: jsonData.length,
        });
      } catch (error) {
        resolve({
          success: false,
          errors: [(error as Error).message],
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        errors: ['Failed to read file'],
      });
    };
    
    reader.readAsBinaryString(file);
  });
};

// Detect file type and parse accordingly
export const parseImportFile = async (file: File): Promise<ImportResult> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'csv') {
    return parseCSVFile(file);
  } else if (extension === 'xls' || extension === 'xlsx') {
    return parseExcelFile(file);
  } else {
    return {
      success: false,
      errors: ['Unsupported file type. Please use CSV, XLS, or XLSX files.'],
    };
  }
};

// Auto-detect field mappings based on column name similarity
export const autoDetectMappings = (
  sourceColumns: string[],
  targetFields: { field: string; label: string }[]
): FieldMapping[] => {
  const mappings: FieldMapping[] = [];
  
  sourceColumns.forEach((sourceCol) => {
    const normalizedSource = sourceCol.toLowerCase().replace(/[_\s-]/g, '');
    
    // Try to find a matching target field
    const match = targetFields.find((target) => {
      const normalizedTarget = target.field.toLowerCase().replace(/[_\s-]/g, '');
      const normalizedLabel = target.label.toLowerCase().replace(/[_\s-]/g, '');
      
      return (
        normalizedSource === normalizedTarget ||
        normalizedSource === normalizedLabel ||
        normalizedSource.includes(normalizedTarget) ||
        normalizedTarget.includes(normalizedSource) ||
        normalizedSource.includes(normalizedLabel) ||
        normalizedLabel.includes(normalizedSource)
      );
    });
    
    if (match) {
      mappings.push({
        sourceField: sourceCol,
        targetField: match.field,
      });
    }
  });
  
  return mappings;
};

// Zoho Books specific field mappings
export const ZOHO_FIELD_MAPPINGS: Record<string, ZohoFieldConfig[]> = {
  clients: [
    { zohoFields: ['Customer Name', 'Name', 'Customer'], targetField: 'name', required: true },
    { zohoFields: ['Email', 'Email Address', 'Customer Email'], targetField: 'email', required: false },
    { zohoFields: ['Phone', 'Phone Number', 'Mobile', 'Contact Number'], targetField: 'phone', required: false },
    { zohoFields: ['Billing Address', 'Address', 'Street Address'], targetField: 'address', required: false },
    { zohoFields: ['GSTIN', 'GST Number', 'GST No', 'GST', 'Tax Number'], targetField: 'gstin', required: false },
  ],
  vendors: [
    { zohoFields: ['Vendor Name', 'Name', 'Supplier Name'], targetField: 'name', required: true },
    { zohoFields: ['Email', 'Email Address', 'Vendor Email'], targetField: 'email', required: false },
    { zohoFields: ['Phone', 'Phone Number', 'Mobile', 'Contact Number'], targetField: 'phone', required: false },
    { zohoFields: ['Address', 'Billing Address', 'Street Address'], targetField: 'address', required: false },
    { zohoFields: ['GSTIN', 'GST Number', 'GST No', 'GST', 'Tax Number'], targetField: 'gstin', required: false },
  ],
  items: [
    { zohoFields: ['Item Name', 'Name', 'Product Name'], targetField: 'name', required: true },
    { zohoFields: ['SKU', 'Item Code', 'Product Code', 'Code'], targetField: 'sku', required: false },
    { zohoFields: ['Rate', 'Price', 'Selling Price', 'Unit Price'], targetField: 'rate', required: false, transform: (v: unknown) => parseFloat(String(v)) || 0 },
    { zohoFields: ['Description', 'Item Description', 'Product Description'], targetField: 'description', required: false },
    { zohoFields: ['Product Type', 'Type', 'Item Type'], targetField: 'type', required: false, transform: (v: unknown) => String(v).toLowerCase() === 'service' ? 'service' : 'goods' },
    { zohoFields: ['Is Taxable', 'Taxable', 'Tax'], targetField: 'taxable', required: false, transform: (v: unknown) => String(v).toLowerCase() === 'yes' || String(v).toLowerCase() === 'true' || v === true },
  ],
  invoices: [
    { zohoFields: ['Invoice Number', 'Invoice#', 'Invoice No', 'Invoice'], targetField: 'invoice_number', required: true },
    { zohoFields: ['Customer Name', 'Client Name', 'Customer', 'Client'], targetField: 'customer_name', required: true },
    { zohoFields: ['Invoice Date', 'Date', 'Issue Date', 'Created Date'], targetField: 'date_issued', required: false, transform: (v: unknown) => {
      if (!v) return new Date().toISOString().split('T')[0];
      const dateStr = String(v);
      // Handle various date formats
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
      // Handle DD/MM/YYYY format
      const parts = dateStr.split(/[\/\-]/);
      if (parts.length === 3) {
        const [d, m, y] = parts;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
      return new Date().toISOString().split('T')[0];
    }},
    { zohoFields: ['Due Date', 'Payment Due Date'], targetField: 'due_date', required: false, transform: (v: unknown) => {
      if (!v) {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date.toISOString().split('T')[0];
      }
      const dateStr = String(v);
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
      const parts = dateStr.split(/[\/\-]/);
      if (parts.length === 3) {
        const [d, m, y] = parts;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      return defaultDate.toISOString().split('T')[0];
    }},
    { zohoFields: ['Total', 'Amount', 'Invoice Total', 'Grand Total', 'Total Amount'], targetField: 'total_amount', required: false, transform: (v: unknown) => parseFloat(String(v).replace(/[₹,]/g, '')) || 0 },
    { zohoFields: ['Status', 'Invoice Status', 'Payment Status'], targetField: 'status', required: false, transform: (v: unknown) => {
      const status = String(v).toUpperCase();
      if (status.includes('PAID')) return 'PAID';
      if (status.includes('OVERDUE')) return 'OVERDUE';
      if (status.includes('DRAFT')) return 'DRAFT';
      return 'PENDING';
    }},
    { zohoFields: ['Notes', 'Customer Notes', 'Invoice Notes', 'Memo'], targetField: 'notes', required: false },
  ],
  invoice_items: [
    { zohoFields: ['Invoice Number', 'Invoice#', 'Invoice No'], targetField: 'invoice_number', required: true },
    { zohoFields: ['Item Name', 'Product Name', 'Item', 'Description', 'Item Description'], targetField: 'description', required: true },
    { zohoFields: ['Quantity', 'Qty'], targetField: 'quantity', required: false, transform: (v: unknown) => parseFloat(String(v)) || 1 },
    { zohoFields: ['Rate', 'Price', 'Unit Price'], targetField: 'rate', required: false, transform: (v: unknown) => parseFloat(String(v).replace(/[₹,]/g, '')) || 0 },
    { zohoFields: ['Tax', 'Tax %', 'Tax Rate', 'Tax Percent', 'GST %'], targetField: 'tax_percent', required: false, transform: (v: unknown) => parseFloat(String(v).replace('%', '')) || 0 },
    { zohoFields: ['Amount', 'Total', 'Line Total', 'Item Total'], targetField: 'total', required: false, transform: (v: unknown) => parseFloat(String(v).replace(/[₹,]/g, '')) || 0 },
  ],
};

// Transform data using field mappings
export const transformData = (
  data: Record<string, unknown>[],
  mappings: FieldMapping[],
  moduleConfig?: ZohoFieldConfig[]
): Record<string, unknown>[] => {
  return data.map((row) => {
    const transformed: Record<string, unknown> = {};
    
    mappings.forEach((mapping) => {
      let value = row[mapping.sourceField];
      
      // Apply transform if defined in module config
      if (moduleConfig) {
        const fieldConfig = moduleConfig.find(f => f.targetField === mapping.targetField);
        if (fieldConfig?.transform && value !== undefined && value !== null && value !== '') {
          value = fieldConfig.transform(value);
        }
      }
      
      transformed[mapping.targetField] = value;
    });
    
    return transformed;
  });
};

// Validate transformed data
export const validateImportData = (
  data: Record<string, unknown>[],
  requiredFields: string[]
): { valid: Record<string, unknown>[]; errors: { row: number; message: string }[] } => {
  const valid: Record<string, unknown>[] = [];
  const errors: { row: number; message: string }[] = [];
  
  data.forEach((row, index) => {
    const missingFields = requiredFields.filter(
      (field) => !row[field] || String(row[field]).trim() === ''
    );
    
    if (missingFields.length > 0) {
      errors.push({
        row: index + 1,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    } else {
      valid.push(row);
    }
  });
  
  return { valid, errors };
};

// Generate import summary report
export const generateImportReport = (
  totalRows: number,
  successCount: number,
  errors: { row: number; message: string }[]
): string => {
  let report = `Import Summary\n`;
  report += `==============\n`;
  report += `Total rows: ${totalRows}\n`;
  report += `Successfully imported: ${successCount}\n`;
  report += `Failed: ${errors.length}\n`;
  
  if (errors.length > 0) {
    report += `\nErrors:\n`;
    errors.slice(0, 10).forEach((error) => {
      report += `  Row ${error.row}: ${error.message}\n`;
    });
    if (errors.length > 10) {
      report += `  ... and ${errors.length - 10} more errors\n`;
    }
  }
  
  return report;
};

// Export data to CSV
export const exportToCSV = (data: Record<string, unknown>[], filename: string): void => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// Export data to Excel
export const exportToExcel = (data: Record<string, unknown>[], filename: string): void => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
