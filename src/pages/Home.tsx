import { MainLayout } from "@/components/layout/MainLayout";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { SupabaseNote } from "@/components/ui/supabase-note";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell } from "lucide-react";

const Home = () => {
  return (
    <MainLayout 
      title="Dashboard" 
      searchPlaceholder="Search in Dashboard"
    >
      <div className="mb-6">
        <SupabaseNote />
        
        <div className="flex items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Hello, User</h1>
            <p className="text-muted-foreground">Welcome to your accounting dashboard</p>
          </div>
        </div>
        
        <Card className="mb-6 border-l-4 border-l-books-yellow bg-books-light-blue/20">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="text-books-yellow mt-1">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium mb-1">Update TCS and TDS in Books</h3>
              <p className="text-sm text-books-text">The Union Budget 2025-26 has introduced changes related to Tax Collected at Source (TCS) and Tax Deducted at Source (TDS). These changes will come into effect from April 1, 2025.</p>
            </div>
            <Button size="sm" variant="outline" className="whitespace-nowrap">
              View Updates
            </Button>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="dashboard">
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="updates">Recent Updates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6">
            <SummaryCards />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <CashFlowChart />
              
              <div>
                <RecentActivity />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="getting-started">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started with Books</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-center gap-2">
                    <div className="bg-books-light-blue rounded-full w-6 h-6 flex items-center justify-center text-books-blue font-bold">1</div>
                    <span>Set up your company profile</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="bg-books-light-blue rounded-full w-6 h-6 flex items-center justify-center text-books-blue font-bold">2</div>
                    <span>Add your customers and vendors</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="bg-books-light-blue rounded-full w-6 h-6 flex items-center justify-center text-books-blue font-bold">3</div>
                    <span>Connect your bank accounts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="bg-books-light-blue rounded-full w-6 h-6 flex items-center justify-center text-books-blue font-bold">4</div>
                    <span>Add your products and services</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="announcements">
            <Card>
              <CardHeader>
                <CardTitle>Latest Announcements</CardTitle>
              </CardHeader>
              <CardContent>
                <p>No new announcements at this time.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="updates">
            <Card>
              <CardHeader>
                <CardTitle>Recent Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-b pb-3">
                    <h3 className="font-medium">Tax Updates 2025</h3>
                    <p className="text-sm text-muted-foreground">New tax regulations effective from April 1, 2025</p>
                  </div>
                  <div className="border-b pb-3">
                    <h3 className="font-medium">New Reporting Features</h3>
                    <p className="text-sm text-muted-foreground">Enhanced reporting capabilities added on March 15, 2025</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Home;
