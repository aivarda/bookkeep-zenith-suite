
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, PieChart, LineChart, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const Reports = () => {
  const reportCategories = [
    {
      category: "Financial Reports",
      reports: [
        { name: "Balance Sheet", icon: <PieChart className="h-5 w-5" /> },
        { name: "Profit & Loss", icon: <BarChart2 className="h-5 w-5" /> },
        { name: "Cash Flow Statement", icon: <LineChart className="h-5 w-5" /> },
      ]
    },
    {
      category: "Sales Reports",
      reports: [
        { name: "Sales by Customer", icon: <BarChart2 className="h-5 w-5" /> },
        { name: "Sales by Item", icon: <BarChart2 className="h-5 w-5" /> },
        { name: "Receivables Aging", icon: <LineChart className="h-5 w-5" /> },
      ]
    },
    {
      category: "Purchase Reports",
      reports: [
        { name: "Purchase by Vendor", icon: <BarChart2 className="h-5 w-5" /> },
        { name: "Purchase by Item", icon: <BarChart2 className="h-5 w-5" /> },
        { name: "Payables Aging", icon: <LineChart className="h-5 w-5" /> },
      ]
    },
    {
      category: "Tax Reports",
      reports: [
        { name: "Tax Summary", icon: <BarChart2 className="h-5 w-5" /> },
        { name: "GST Reports", icon: <BarChart2 className="h-5 w-5" /> },
      ]
    },
  ];

  return (
    <MainLayout title="Reports" showSearch={false}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Reports</h1>
        </div>
        
        <div className="relative max-w-md w-full mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search reports" className="pl-10" />
        </div>
        
        <div className="space-y-6">
          {reportCategories.map((category) => (
            <div key={category.category} className="space-y-4">
              <h2 className="text-lg font-semibold">{category.category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.reports.map((report) => (
                  <Card key={report.name} className="hover:border-books-blue transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="bg-books-light-blue rounded-full p-2 text-books-blue">
                        {report.icon}
                      </div>
                      <span>{report.name}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Reports;
