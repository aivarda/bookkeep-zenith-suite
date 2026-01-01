
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileText, 
  CreditCard, 
  ClipboardList, 
  Truck, 
  ShoppingCart,
  ArrowRight,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";

interface SalesModule {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
}

const salesModules: SalesModule[] = [
  {
    title: "Customers",
    description: "Manage your customer database and contact information.",
    icon: <Users className="h-6 w-6 text-books-blue" />,
    path: "/sales/customers"
  },
  {
    title: "Estimates",
    description: "Create estimates for your customers to approve before converting to invoices.",
    icon: <FileText className="h-6 w-6 text-books-blue" />,
    path: "/sales/estimates"
  },
  {
    title: "Invoices",
    description: "Create and manage invoices for your customers.",
    icon: <FileText className="h-6 w-6 text-books-blue" />,
    path: "/sales/invoices"
  },
  {
    title: "Payments Received",
    description: "Record payments received from your customers.",
    icon: <CreditCard className="h-6 w-6 text-books-blue" />,
    path: "/sales/payments-received"
  },
  {
    title: "Sales Orders",
    description: "Create and manage sales orders for your customers.",
    icon: <ClipboardList className="h-6 w-6 text-books-blue" />,
    path: "/sales/sales-orders"
  },
  {
    title: "Delivery Challans",
    description: "Create delivery challans for your customers.",
    icon: <Truck className="h-6 w-6 text-books-blue" />,
    path: "/sales/delivery-challans"
  },
];

const Sales = () => {
  return (
    <MainLayout title="Sales" searchPlaceholder="Search in Sales">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <ShoppingCart className="h-8 w-8 text-books-blue" />
          <h1 className="text-2xl font-bold">Sales</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {salesModules.map((module) => (
            <Link to={module.path} key={module.title}>
              <Card className="h-full hover:border-books-blue transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">{module.icon}</div>
                    <div className="space-y-2 flex-1">
                      <h3 className="font-medium text-lg">{module.title}</h3>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                      <div className="flex items-center text-sm text-books-blue font-medium pt-2">
                        <span>View</span>
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Sales;
