
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ChevronRight } from "lucide-react";

const GSTFiling = () => {
  return (
    <MainLayout title="GST Filing" searchPlaceholder="Search GST records">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">GST Filing</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>GSTR-1</span>
                <Button variant="ghost" size="sm" className="text-books-blue">
                  View <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Monthly return of outward supplies of goods or services
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm">Next filing due on:</span>
                <span className="text-sm font-medium">11 Jun 2025</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>GSTR-3B</span>
                <Button variant="ghost" size="sm" className="text-books-blue">
                  View <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Monthly summary return of all supplies effected and received
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm">Next filing due on:</span>
                <span className="text-sm font-medium">20 Jun 2025</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>GSTR-9</span>
                <Button variant="ghost" size="sm" className="text-books-blue">
                  View <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Annual Return to be filed once in a year
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm">Next filing due on:</span>
                <span className="text-sm font-medium">31 Dec 2025</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>GST Filing History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <FileText className="h-16 w-16 text-books-blue" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Filing History</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Your GST filing history will appear here once you start filing returns.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default GSTFiling;
