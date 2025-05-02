
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Clock, PlayCircle } from "lucide-react";

const TimeTracking = () => {
  const topbarButtons = (
    <Button className="bg-books-blue hover:bg-blue-700">
      <Plus className="h-4 w-4 mr-1" /> New Time Entry
    </Button>
  );

  return (
    <MainLayout title="Time Tracking" searchPlaceholder="Search time entries" topbarButtons={topbarButtons}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Time Tracking</h1>
        
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex justify-center mb-4">
              <Clock className="h-16 w-16 text-books-blue" />
            </div>
            <h3 className="text-xl font-bold mb-2">Track Your Time</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Track time spent on projects and tasks to bill your clients accurately.
            </p>
            <Button className="bg-books-blue hover:bg-blue-700">
              <PlayCircle className="h-4 w-4 mr-1" /> Start Tracking
            </Button>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">0:00</div>
              <p className="text-sm text-muted-foreground">No time recorded this week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">0:00</div>
              <p className="text-sm text-muted-foreground">No time recorded this month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Unbilled Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">0:00</div>
              <p className="text-sm text-muted-foreground">No unbilled time</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default TimeTracking;
