
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Truck } from "lucide-react";

const EwayBills = () => {
  const topbarButtons = (
    <Button className="bg-books-blue hover:bg-blue-700">
      <Plus className="h-4 w-4 mr-1" /> Generate e-Way Bill
    </Button>
  );

  return (
    <MainLayout title="e-Way Bills" searchPlaceholder="Search e-Way Bills" topbarButtons={topbarButtons}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">e-Way Bills</h1>
        
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex justify-center mb-4">
              <Truck className="h-16 w-16 text-books-blue" />
            </div>
            <h3 className="text-xl font-bold mb-2">Generate e-Way Bills</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Electronic Way Bills for movement of goods with value exceeding ₹50,000.
            </p>
            <Button className="bg-books-blue hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-1" /> Generate Now
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default EwayBills;
