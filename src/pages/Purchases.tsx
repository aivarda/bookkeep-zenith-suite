
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Receipt,
  CreditCard,
  DollarSign,
  ClipboardList,
  Package,
  ArrowRight,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";

interface PurchaseModule {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
}

const purchaseModules: PurchaseModule[] = [
  {
    title: "Vendors",
    description: "Manage your vendor database and contact information.",
    icon: <Users className="h-6 w-6 text-books-blue" />,
    path: "/purchases/vendors"
  },
  {
    title: "Bills",
    description: "Create and manage bills from your vendors.",
    icon: <Receipt className="h-6 w-6 text-books-blue" />,
    path: "/purchases/bills"
  },
  {
    title: "Vendor Credits",
    description: "Manage credits received from your vendors.",
    icon: <CreditCard className="h-6 w-6 text-books-blue" />,
    path: "/purchases/vendor-credits"
  },
  {
    title: "Payments Made",
    description: "Record payments made to your vendors.",
    icon: <DollarSign className="h-6 w-6 text-books-blue" />,
    path: "/purchases/payments-made"
  },
  {
    title: "Purchase Orders",
    description: "Create and manage purchase orders for your vendors.",
    icon: <ClipboardList className="h-6 w-6 text-books-blue" />,
    path: "/purchases/purchase-orders"
  }
];

const Purchases = () => {
  return (
    <MainLayout title="Purchases" searchPlaceholder="Search in Purchases">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Package className="h-8 w-8 text-books-blue" />
          <h1 className="text-2xl font-bold">Purchases</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchaseModules.map((module) => (
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

export default Purchases;
