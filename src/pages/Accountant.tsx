
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, FileText, PlusCircle } from "lucide-react";

const Accountant = () => {
  return (
    <MainLayout title="Accountant" searchPlaceholder="Search in Accountant">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Accountant</h1>
          <Button className="bg-books-blue hover:bg-blue-700">
            <User className="h-4 w-4 mr-1" /> Invite Accountant
          </Button>
        </div>
        
        <Tabs defaultValue="chart">
          <TabsList className="mb-6">
            <TabsTrigger value="chart">Chart of Accounts</TabsTrigger>
            <TabsTrigger value="journals">Manual Journals</TabsTrigger>
            <TabsTrigger value="update">Bulk Update</TabsTrigger>
            <TabsTrigger value="transaction">Transaction Locking</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Chart of Accounts</CardTitle>
                <Button size="sm" className="bg-books-blue hover:bg-blue-700">
                  <PlusCircle className="h-4 w-4 mr-1" /> New Account
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Account Name</th>
                        <th className="text-left p-3">Account Code</th>
                        <th className="text-left p-3">Account Type</th>
                        <th className="text-left p-3">Documents</th>
                        <th className="text-left p-3">Parent Account Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-3">TDS - Section 194-O</td>
                        <td className="p-3">194-O</td>
                        <td className="p-3">Other Current Asset</td>
                        <td className="p-3"></td>
                        <td className="p-3"></td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-3">Advance Tax</td>
                        <td className="p-3"></td>
                        <td className="p-3">Other Current Asset</td>
                        <td className="p-3"></td>
                        <td className="p-3"></td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-3">Employee Advance</td>
                        <td className="p-3"></td>
                        <td className="p-3">Other Current Asset</td>
                        <td className="p-3"></td>
                        <td className="p-3"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="journals">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Manual Journals</CardTitle>
                <Button size="sm" className="bg-books-blue hover:bg-blue-700">
                  <FileText className="h-4 w-4 mr-1" /> New Journal
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No Journals Found</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Create manual journal entries to record transactions not captured elsewhere in the system.
                  </p>
                  <Button className="bg-books-blue hover:bg-blue-700">
                    <PlusCircle className="h-4 w-4 mr-1" /> Create Journal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="update">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Update</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center p-8 text-muted-foreground">
                  Bulk update feature allows you to update multiple transactions at once.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="transaction">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Locking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center p-8 text-muted-foreground">
                  Lock periods to prevent changes to transactions within those periods.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Accountant;
