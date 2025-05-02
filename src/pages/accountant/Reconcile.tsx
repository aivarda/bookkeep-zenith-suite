
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

const Reconcile = () => {
  const topbarButtons = (
    <Button className="bg-books-blue hover:bg-blue-700">
      <Clock className="h-4 w-4 mr-1" /> Start Reconciliation
    </Button>
  );

  return (
    <MainLayout title="Reconcile" searchPlaceholder="Search reconciliations" topbarButtons={topbarButtons}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Account Reconciliation</h1>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reconciliation Status</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
            No pending reconciliations. Click the "Start Reconciliation" button to begin.
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Reconcile;
