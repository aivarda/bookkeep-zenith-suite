
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash, X, Upload } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ImportDialog } from "@/components/import/ImportDialog";
import { ZOHO_FIELD_MAPPINGS } from "@/lib/import-utils";

interface Item {
  id: string;
  name: string;
  type: string;
  rate: number;
  description: string | null;
  sku: string | null;
  taxable: boolean;
  created_at: string;
}

const Items = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [inventoryData, setInventoryData] = useState<Record<string, any>>({});
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    description: "",
    rate: 0,
    unit: "",
    sku: "",
    taxable: true,
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select("*")
        .order("name");
        
      if (itemsError) throw itemsError;
      
      // Fetch inventory data for each item
      if (itemsData && itemsData.length > 0) {
        const { data: inventoryItems, error: inventoryError } = await supabase
          .from("inventory")
          .select("*")
          .in("item_id", itemsData.map(item => item.id));
          
        if (inventoryError) throw inventoryError;
        
        // Create a lookup object for inventory data
        const inventoryLookup: Record<string, any> = {};
        if (inventoryItems) {
          inventoryItems.forEach(invItem => {
            inventoryLookup[invItem.item_id] = invItem;
          });
        }
        
        setInventoryData(inventoryLookup);
      }
      
      setItems(itemsData || []);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Could not load items");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "rate" ? parseFloat(value) || 0 : value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleTaxableChange = (value: string) => {
    setFormData({ ...formData, taxable: value === "yes" });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      description: "",
      rate: 0,
      unit: "",
      sku: "",
      taxable: true,
    });
    setEditingItem(null);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      type: item.type,
      description: item.description || "",
      rate: item.rate,
      unit: inventoryData[item.id]?.unit || "",
      sku: item.sku || "",
      taxable: item.taxable,
    });
    setOpenDialog(true);
  };

  const handleDeleteItem = async (id: string) => {
    try {
      // First delete from inventory if exists
      await supabase
        .from("inventory")
        .delete()
        .eq("item_id", id);
        
      // Then delete the item
      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      toast.success("Item deleted successfully");
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Could not delete the item");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        // Update existing item
        const { error: itemError } = await supabase
          .from("items")
          .update({
            name: formData.name,
            type: formData.type,
            description: formData.description || null,
            rate: formData.rate,
            sku: formData.sku || null,
            taxable: formData.taxable,
          })
          .eq("id", editingItem.id);
          
        if (itemError) throw itemError;
        
        // Update or insert inventory record
        const { data: existingInventory } = await supabase
          .from("inventory")
          .select("id")
          .eq("item_id", editingItem.id)
          .maybeSingle();
          
        if (existingInventory) {
          await supabase
            .from("inventory")
            .update({
              unit: formData.unit || null,
            })
            .eq("item_id", editingItem.id);
        } else if (formData.unit) {
          await supabase
            .from("inventory")
            .insert({
              item_id: editingItem.id,
              unit: formData.unit,
              opening_stock: 0,
              current_stock: 0,
            });
        }
        
        toast.success("Item updated successfully");
      } else {
        // Create new item
        const { data: newItem, error: itemError } = await supabase
          .from("items")
          .insert({
            name: formData.name,
            type: formData.type,
            description: formData.description || null,
            rate: formData.rate,
            sku: formData.sku || null,
            taxable: formData.taxable,
          })
          .select()
          .single();
          
        if (itemError) throw itemError;
        
        // Add inventory record if unit is provided
        if (formData.unit && newItem) {
          await supabase
            .from("inventory")
            .insert({
              item_id: newItem.id,
              unit: formData.unit,
              opening_stock: 0,
              current_stock: 0,
            });
        }
        
        toast.success("Item created successfully");
      }
      
      setOpenDialog(false);
      resetForm();
      fetchItems();
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error("Could not save the item");
    }
  };

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
      cell: ({ row }) => {
        const item = row.original;
        return inventoryData[item.id]?.unit || "-";
      },
    },
    {
      accessorKey: "rate",
      header: "Rate",
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("rate"));
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
      cell: ({ row }) => {
        const item = row.original;
        return item.type === "Service" ? "N/A" : (inventoryData[item.id]?.current_stock || 0).toString();
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleEditItem(item)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-red-500 hover:text-red-700" 
              onClick={() => handleDeleteItem(item.id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const handleImport = async (data: Record<string, unknown>[]) => {
    let success = 0;
    let failed = 0;

    for (const row of data) {
      try {
        const { data: newItem, error } = await supabase.from("items").insert({
          name: String(row.name || "").trim(),
          sku: row.sku ? String(row.sku).trim() : null,
          rate: typeof row.rate === "number" ? row.rate : parseFloat(String(row.rate)) || 0,
          description: row.description ? String(row.description).trim() : null,
          type: row.type === "service" ? "Service" : "Goods",
          taxable: row.taxable === true || row.taxable === "true" || row.taxable === "Yes",
        }).select().single();

        if (error) {
          failed++;
        } else {
          success++;
          // Create inventory record for goods
          if (newItem && row.type !== "service") {
            await supabase.from("inventory").insert({
              item_id: newItem.id,
              unit: null,
              opening_stock: 0,
              current_stock: 0,
            });
          }
        }
      } catch {
        failed++;
      }
    }

    fetchItems();
    return { success, failed };
  };

  const importTargetFields = [
    { field: "name", label: "Item Name", required: true },
    { field: "sku", label: "SKU", required: false },
    { field: "rate", label: "Rate", required: false },
    { field: "description", label: "Description", required: false },
    { field: "type", label: "Type (goods/service)", required: false },
    { field: "taxable", label: "Taxable", required: false },
  ];

  const topbarButtons = (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
        <Upload className="h-4 w-4 mr-1" /> Import
      </Button>
      <Button className="bg-books-blue hover:bg-blue-700" onClick={() => {
        resetForm();
        setOpenDialog(true);
      }}>
        <Plus className="h-4 w-4 mr-1" /> Add Item
      </Button>
    </div>
  );

  return (
    <MainLayout title="Items" searchPlaceholder="Search items" topbarButtons={topbarButtons}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">All Items</h1>
        </div>
        
        <div>
          <DataTable 
            columns={columns} 
            data={items} 
            isLoading={loading} 
          />
        </div>
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
            <DialogDescription>
              {editingItem 
                ? "Update the item details below." 
                : "Enter the details for the new item."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Item Type *</Label>
                <Select
                  name="type"
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange("type", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select item type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Goods">Goods</SelectItem>
                    <SelectItem value="Service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rate">Rate *</Label>
                <Input
                  id="rate"
                  name="rate"
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  disabled={formData.type === "Service"}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxable">Taxable</Label>
                <Select
                  name="taxable"
                  value={formData.taxable ? "yes" : "no"}
                  onValueChange={(value) => handleTaxableChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpenDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-books-blue hover:bg-blue-700">
                {editingItem ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="Import Items"
        description="Import items from a CSV or Excel file exported from Zoho Books or any other software."
        targetFields={importTargetFields}
        zohoFieldConfig={ZOHO_FIELD_MAPPINGS.items}
        onImport={handleImport}
      />
    </MainLayout>
  );
};

export default Items;
