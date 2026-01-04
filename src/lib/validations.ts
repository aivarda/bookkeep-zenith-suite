import { z } from "zod";

// Client/Customer validation
export const clientSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional().or(z.literal("")),
  address: z.string().trim().max(500, "Address must be less than 500 characters").optional().or(z.literal("")),
  gstin: z.string().trim()
    .regex(/^$|^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format")
    .optional()
    .or(z.literal("")),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// Vendor validation (same as client)
export const vendorSchema = clientSchema;
export type VendorFormData = z.infer<typeof vendorSchema>;

// Item validation
export const itemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  sku: z.string().trim().max(50, "SKU must be less than 50 characters").optional().or(z.literal("")),
  description: z.string().trim().max(500, "Description must be less than 500 characters").optional().or(z.literal("")),
  type: z.enum(["Goods", "Services"]),
  rate: z.number().min(0, "Rate must be positive"),
  taxable: z.boolean(),
});

export type ItemFormData = z.infer<typeof itemSchema>;

// Invoice validation
export const invoiceSchema = z.object({
  client_id: z.string().uuid("Please select a customer"),
  invoice_number: z.string().trim().min(1, "Invoice number is required"),
  date_issued: z.string().min(1, "Date is required"),
  due_date: z.string().min(1, "Due date is required"),
  notes: z.string().trim().max(1000, "Notes must be less than 1000 characters").optional().or(z.literal("")),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

// Payment validation
export const paymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  payment_mode: z.string().optional(),
  reference_number: z.string().trim().max(100).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

// Bank Account validation
export const bankAccountSchema = z.object({
  account_name: z.string().trim().min(1, "Account name is required").max(100),
  account_type: z.enum(["Savings", "Current", "Cash"]),
  bank_name: z.string().trim().max(100).optional().or(z.literal("")),
  account_number: z.string().trim().max(20, "Account number too long").optional().or(z.literal("")),
  ifsc_code: z.string().trim()
    .regex(/^$|^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC format")
    .optional()
    .or(z.literal("")),
  opening_balance: z.number().default(0),
});

export type BankAccountFormData = z.infer<typeof bankAccountSchema>;

// Chart of Accounts validation
export const accountSchema = z.object({
  account_name: z.string().trim().min(1, "Account name is required").max(100),
  account_type: z.string().min(1, "Account type is required"),
  account_code: z.string().trim().max(20).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  parent_account_id: z.string().uuid().optional().or(z.literal("")),
});

export type AccountFormData = z.infer<typeof accountSchema>;

// Journal Entry validation
export const journalEntrySchema = z.object({
  account_id: z.string().uuid("Please select an account"),
  debit_amount: z.number().min(0, "Amount must be positive"),
  credit_amount: z.number().min(0, "Amount must be positive"),
  description: z.string().trim().max(500).optional().or(z.literal("")),
}).refine(
  (data) => (data.debit_amount > 0 && data.credit_amount === 0) || (data.credit_amount > 0 && data.debit_amount === 0),
  { message: "Entry must have either debit or credit, not both" }
);
export type JournalEntryFormData = z.infer<typeof journalEntrySchema>;

// Company Settings validation
export const companySettingsSchema = z.object({
  company_name: z.string().trim().min(1, "Company name is required").max(100, "Company name must be less than 100 characters"),
  address: z.string().trim().max(500, "Address must be less than 500 characters").optional().or(z.literal("")),
  gstin: z.string().trim()
    .regex(/^$|^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format")
    .optional()
    .or(z.literal("")),
  email: z.string().trim().email("Invalid email address").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional().or(z.literal("")),
  logo_url: z.string().trim().url("Invalid URL").max(500).optional().or(z.literal("")),
});

export type CompanySettingsFormData = z.infer<typeof companySettingsSchema>;
// Helper function to validate form data
export const validateFormData = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join(".");
    if (path) {
      errors[path] = err.message;
    }
  });
  
  return { success: false, errors };
};
