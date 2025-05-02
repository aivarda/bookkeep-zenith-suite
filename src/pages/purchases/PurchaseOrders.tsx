
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const PurchaseOrders = () => {
  return (
    <MainLayout title="Purchase Orders" searchPlaceholder="Search purchase orders">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <Button className="bg-books-blue hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-1" /> New Purchase Order
          </Button>
        </div>
        
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-md border">
          <p className="text-muted-foreground">No purchase orders found</p>
          <Button className="mt-4 bg-books-blue hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-1" /> Create Your First Purchase Order
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default PurchaseOrders;
