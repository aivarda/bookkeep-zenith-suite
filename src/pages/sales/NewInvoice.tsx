
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash, ArrowLeft, FileText, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
  description: string | null;
  rate: number;
  taxable: boolean;
}

interface InvoiceItem {
  id?: string;
  item_id?: string;
  product_id?: string;
  description: string;
  quantity: number;
  rate: number;
  tax_percent: number;
  total: number;
}

const NewInvoice = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = id !== undefined && id !== "new";
  
  const [clients, setClients] = useState<Client[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingInvoice, setSavingInvoice] = useState(false);
  
  const [formData, setFormData] = useState({
    client_id: "",
    invoice_number: "",
    date_issued: new Date().toISOString().split("T")[0],
    due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0],
    status: "DRAFT",
    notes: "",
    items: [] as InvoiceItem[],
  });

  useEffect(() => {
    Promise.all([fetchClients(), fetchItems()]).then(() => {
      if (isEditing) {
        fetchInvoice(id!);
      } else {
        generateInvoiceNumber();
        setLoading(false);
      }
    });
  }, [id]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");
        
      if (error) throw error;
      
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Could not load clients");
    }
  };

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("items")
        .select("id, name, description, rate, taxable")
        .order("name");
        
      if (error) throw error;
      
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Could not load items");
    }
  };

  const fetchInvoice = async (invoiceId: string) => {
    try {
      // Fetch invoice data
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();
        
      if (invoiceError) throw invoiceError;
      
      // Fetch invoice items
      const { data: invoiceItems, error: itemsError } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoiceId);
        
      if (itemsError) throw itemsError;
      
      setFormData({
        client_id: invoice.client_id || "",
        invoice_number: invoice.invoice_number,
        date_issued: invoice.date_issued,
        due_date: invoice.due_date,
        status: invoice.status,
        notes: invoice.notes || "",
        items: invoiceItems || [],
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      toast.error("Could not load invoice");
      navigate("/sales/invoices");
    }
  };

  const generateInvoiceNumber = async () => {
    try {
      // Get the last invoice number
      const { data, error } = await supabase
        .from("invoices")
        .select("invoice_number")
        .order("created_at", { ascending: false })
        .limit(1);
        
      if (error) throw error;
      
      let newInvoiceNumber = "INV-0001";
      
      if (data && data.length > 0) {
        const lastNumber = data[0].invoice_number;
        const matches = lastNumber.match(/INV-(\d+)/);
        
        if (matches && matches[1]) {
          const numPart = parseInt(matches[1]);
          newInvoiceNumber = `INV-${String(numPart + 1).padStart(4, '0')}`;
        }
      }
      
      setFormData(prev => ({ ...prev, invoice_number: newInvoiceNumber }));
    } catch (error) {
      console.error("Error generating invoice number:", error);
      // Use default if error
      setFormData(prev => ({ ...prev, invoice_number: "INV-0001" }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      item_id: "",
      description: "",
      quantity: 1,
      rate: 0,
      tax_percent: 0,
      total: 0,
    };
    
    setFormData({
      ...formData,
      items: [...formData.items, newItem],
    });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    
    setFormData({
      ...formData,
      items: updatedItems,
    });
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...formData.items];
    
    if (field === "item_id" && value) {
      const selectedItem = items.find(item => item.id === value);
      if (selectedItem) {
        updatedItems[index] = {
          ...updatedItems[index],
          item_id: selectedItem.id,
          description: selectedItem.description || selectedItem.name,
          rate: selectedItem.rate,
          tax_percent: selectedItem.taxable ? 18 : 0,
        };
      }
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };
    }
    
    // Recalculate total
    const quantity = field === "quantity" ? parseFloat(value) || 0 : updatedItems[index].quantity;
    const rate = field === "rate" ? parseFloat(value) || 0 : updatedItems[index].rate;
    const taxPercent = field === "tax_percent" ? parseFloat(value) || 0 : updatedItems[index].tax_percent;
    
    const subtotal = quantity * rate;
    const tax = subtotal * (taxPercent / 100);
    const total = subtotal + tax;
    
    updatedItems[index].total = parseFloat(total.toFixed(2));
    
    setFormData({
      ...formData,
      items: updatedItems,
    });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmit = async (e: React.FormEvent, saveStatus: string) => {
    e.preventDefault();
    setSavingInvoice(true);
    
    try {
      const totalAmount = calculateTotal();
      
      if (formData.items.length === 0) {
        toast.error("Please add at least one item to the invoice");
        setSavingInvoice(false);
        return;
      }
      
      if (!formData.client_id) {
        toast.error("Please select a client");
        setSavingInvoice(false);
        return;
      }
      
      const status = saveStatus || formData.status;
      
      if (isEditing) {
        // Update invoice
        const { error: invoiceError } = await supabase
          .from("invoices")
          .update({
            client_id: formData.client_id,
            invoice_number: formData.invoice_number,
            date_issued: formData.date_issued,
            due_date: formData.due_date,
            status: status,
            total_amount: totalAmount,
            notes: formData.notes || null,
          })
          .eq("id", id);
          
        if (invoiceError) throw invoiceError;
        
        // Delete existing invoice items
        await supabase
          .from("invoice_items")
          .delete()
          .eq("invoice_id", id);
          
        // Insert updated invoice items
        const invoiceItems = formData.items.map(item => ({
          invoice_id: id,
          product_id: item.item_id,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          tax_percent: item.tax_percent,
          total: item.total,
        }));
        
        const { error: itemsError } = await supabase
          .from("invoice_items")
          .insert(invoiceItems);
          
        if (itemsError) throw itemsError;
        
        toast.success("Invoice updated successfully");
      } else {
        // Create new invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from("invoices")
          .insert({
            client_id: formData.client_id,
            invoice_number: formData.invoice_number,
            date_issued: formData.date_issued,
            due_date: formData.due_date,
            status: status,
            total_amount: totalAmount,
            notes: formData.notes || null,
          })
          .select()
          .single();
          
        if (invoiceError) throw invoiceError;
        
        // Insert invoice items
        const invoiceItems = formData.items.map(item => ({
          invoice_id: invoice.id,
          product_id: item.item_id,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          tax_percent: item.tax_percent,
          total: item.total,
        }));
        
        const { error: itemsError } = await supabase
          .from("invoice_items")
          .insert(invoiceItems);
          
        if (itemsError) throw itemsError;
        
        toast.success("Invoice created successfully");
      }
      
      navigate("/sales/invoices");
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Could not save the invoice");
    } finally {
      setSavingInvoice(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Invoice" showSearch={false}>
        <div className="flex justify-center items-center h-full">
          <p>Loading invoice...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Invoice" showSearch={false}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/sales/invoices")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{isEditing ? "Edit Invoice" : "New Invoice"}</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Invoice Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <form onSubmit={(e) => handleSubmit(e, formData.status)}>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="client_id">Customer *</Label>
                        <Select
                          value={formData.client_id}
                          onValueChange={(value) => handleSelectChange("client_id", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="invoice_number">Invoice Number *</Label>
                        <Input
                          id="invoice_number"
                          name="invoice_number"
                          value={formData.invoice_number}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="date_issued">Invoice Date *</Label>
                        <Input
                          id="date_issued"
                          name="date_issued"
                          type="date"
                          value={formData.date_issued}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="due_date">Due Date *</Label>
                        <Input
                          id="due_date"
                          name="due_date"
                          type="date"
                          value={formData.due_date}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="status">Status *</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => handleSelectChange("status", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DRAFT">Draft</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="PAID">Paid</SelectItem>
                            <SelectItem value="OVERDUE">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Items</h3>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={handleAddItem}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add Item
                        </Button>
                      </div>
                      
                      <div className="border rounded-md">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="p-2 text-left">Item</th>
                              <th className="p-2 text-left">Description</th>
                              <th className="p-2 text-left w-20">Qty</th>
                              <th className="p-2 text-left w-28">Rate</th>
                              <th className="p-2 text-left w-20">Tax %</th>
                              <th className="p-2 text-left w-28">Amount</th>
                              <th className="p-2 w-10"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.items.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="p-4 text-center text-muted-foreground">
                                  No items added. Click "Add Item" to add an item to this invoice.
                                </td>
                              </tr>
                            ) : (
                              formData.items.map((item, index) => (
                                <tr key={index} className="border-t">
                                  <td className="p-2">
                                    <Select
                                      value={item.item_id}
                                      onValueChange={(value) => handleItemChange(index, "item_id", value)}
                                    >
                                      <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Select item" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {items.map((it) => (
                                          <SelectItem key={it.id} value={it.id}>{it.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </td>
                                  <td className="p-2">
                                    <Input
                                      value={item.description}
                                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                                      className="h-8"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <Input
                                      type="number"
                                      min="1"
                                      step="1"
                                      value={item.quantity}
                                      onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value))}
                                      className="h-8"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={item.rate}
                                      onChange={(e) => handleItemChange(index, "rate", parseFloat(e.target.value))}
                                      className="h-8"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={item.tax_percent}
                                      onChange={(e) => handleItemChange(index, "tax_percent", parseFloat(e.target.value))}
                                      className="h-8"
                                    />
                                  </td>
                                  <td className="p-2">
                                    {new Intl.NumberFormat("en-IN", {
                                      style: "currency",
                                      currency: "INR",
                                    }).format(item.total)}
                                  </td>
                                  <td className="p-2">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveItem(index)}
                                      className="h-8 w-8"
                                    >
                                      <Trash className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                          <tfoot>
                            <tr className="border-t">
                              <td colSpan={5} className="p-2 text-right font-medium">Total:</td>
                              <td className="p-2 font-bold">
                                {new Intl.NumberFormat("en-IN", {
                                  style: "currency",
                                  currency: "INR",
                                }).format(calculateTotal())}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Add notes for the customer"
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/sales/invoices")}
                        disabled={savingInvoice}
                      >
                        Cancel
                      </Button>
                      {formData.status === "DRAFT" && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={(e) => handleSubmit(e, "PENDING")}
                          disabled={savingInvoice}
                        >
                          Save & Send
                        </Button>
                      )}
                      <Button 
                        type="submit"
                        className="bg-books-blue hover:bg-blue-700"
                        disabled={savingInvoice}
                      >
                        {isEditing ? "Update" : "Save"} as {formData.status}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
          
          {/* Invoice Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-medium">Invoice Summary</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                      }).format(calculateTotal())}
                    </span>
                  </div>
                  
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                      }).format(calculateTotal())}
                    </span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      disabled
                    >
                      <FileText className="h-4 w-4 mr-2" /> Preview Invoice
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      disabled
                    >
                      <DollarSign className="h-4 w-4 mr-2" /> Record Payment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default NewInvoice;
