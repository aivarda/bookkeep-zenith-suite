
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const DeliveryChallans = () => {
  return (
    <MainLayout title="Delivery Challans" searchPlaceholder="Search challans">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Delivery Challans</h1>
          <Button className="bg-books-blue hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-1" /> New Delivery Challan
          </Button>
        </div>
        
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-md border">
          <p className="text-muted-foreground">No delivery challans found</p>
          <Button className="mt-4 bg-books-blue hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-1" /> Create Your First Delivery Challan
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default DeliveryChallans;
