
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ManualJournals = () => {
  const topbarButtons = (
    <Button className="bg-books-blue hover:bg-blue-700">
      <Plus className="h-4 w-4 mr-1" /> New Journal
    </Button>
  );

  return (
    <MainLayout title="Manual Journals" searchPlaceholder="Search journals" topbarButtons={topbarButtons}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Manual Journals</h1>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">All Journal Entries</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
            No journal entries found. Click the "New Journal" button to create one.
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ManualJournals;
