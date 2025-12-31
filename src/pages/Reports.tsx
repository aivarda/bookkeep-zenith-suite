import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart2, PieChart, LineChart, Search, TrendingUp, Clock, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

interface ReportItem {
  name: string;
  icon: React.ReactNode;
  path?: string;
  description?: string;
}

interface ReportCategory {
  category: string;
  reports: ReportItem[];
}

const Reports = () => {
  const navigate = useNavigate();

  const reportCategories: ReportCategory[] = [
    {
      category: "Financial Reports",
      reports: [
        { 
          name: "Profit & Loss", 
          icon: <TrendingUp className="h-5 w-5" />, 
          path: "/reports/profit-and-loss",
          description: "Income and expense summary"
        },
        { 
          name: "Balance Sheet", 
          icon: <PieChart className="h-5 w-5" />, 
          path: "/reports/balance-sheet",
          description: "Assets, liabilities & equity"
        },
        { 
          name: "Cash Flow Statement", 
          icon: <LineChart className="h-5 w-5" />,
          description: "Coming soon"
        },
      ]
    },
    {
      category: "Receivables Reports",
      reports: [
        { 
          name: "Receivables Aging", 
          icon: <Clock className="h-5 w-5" />, 
          path: "/reports/receivables-aging",
          description: "Outstanding invoice aging"
        },
        { 
          name: "Sales by Customer", 
          icon: <BarChart2 className="h-5 w-5" />,
          description: "Coming soon"
        },
        { 
          name: "Invoice Summary", 
          icon: <FileText className="h-5 w-5" />,
          description: "Coming soon"
        },
      ]
    },
    {
      category: "Payables Reports",
      reports: [
        { 
          name: "Payables Aging", 
          icon: <Clock className="h-5 w-5" />, 
          path: "/reports/payables-aging",
          description: "Outstanding bill aging"
        },
        { 
          name: "Purchase by Vendor", 
          icon: <BarChart2 className="h-5 w-5" />,
          description: "Coming soon"
        },
        { 
          name: "Bill Summary", 
          icon: <FileText className="h-5 w-5" />,
          description: "Coming soon"
        },
      ]
    },
    {
      category: "Tax Reports",
      reports: [
        { 
          name: "Tax Summary", 
          icon: <BarChart2 className="h-5 w-5" />,
          description: "Coming soon"
        },
        { 
          name: "GST Reports", 
          icon: <BarChart2 className="h-5 w-5" />,
          description: "Coming soon"
        },
      ]
    },
  ];

  const handleReportClick = (report: ReportItem) => {
    if (report.path) {
      navigate(report.path);
    }
  };

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
                  <Card 
                    key={report.name} 
                    className={`transition-colors ${
                      report.path 
                        ? "hover:border-books-blue cursor-pointer" 
                        : "opacity-60 cursor-not-allowed"
                    }`}
                    onClick={() => handleReportClick(report)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`rounded-full p-2 ${
                        report.path 
                          ? "bg-books-light-blue text-books-blue" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {report.icon}
                      </div>
                      <div>
                        <span className="font-medium">{report.name}</span>
                        {report.description && (
                          <p className="text-xs text-muted-foreground">{report.description}</p>
                        )}
                      </div>
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
