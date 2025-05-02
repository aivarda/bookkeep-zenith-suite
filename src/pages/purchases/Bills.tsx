
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Bills = () => {
  return (
    <MainLayout title="Bills" searchPlaceholder="Search bills">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Bills</h1>
          <Button className="bg-books-blue hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-1" /> New Bill
          </Button>
        </div>
        
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-md border">
          <p className="text-muted-foreground">No bills found</p>
          <Button className="mt-4 bg-books-blue hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-1" /> Create Your First Bill
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Bills;
