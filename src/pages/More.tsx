
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CreditCard, Settings, PieChart, User, 
  Users, Building, Globe, Mail, ShieldCheck, 
  FileCheck, Zap, Share2
} from "lucide-react";

const More = () => {
  const features = [
    { name: "Payment Gateways", icon: <CreditCard className="h-5 w-5" />, description: "Connect payment gateways to receive online payments" },
    { name: "Settings", icon: <Settings className="h-5 w-5" />, description: "Configure your organization settings and preferences" },
    { name: "Budgets", icon: <PieChart className="h-5 w-5" />, description: "Create and manage budgets for your business" },
    { name: "Users & Roles", icon: <User className="h-5 w-5" />, description: "Manage users and their access to the system" },
    { name: "Clients Portal", icon: <Users className="h-5 w-5" />, description: "Allow clients to access their invoices and make payments" },
    { name: "Multi-branch", icon: <Building className="h-5 w-5" />, description: "Manage multiple branches of your organization" },
    { name: "International Settings", icon: <Globe className="h-5 w-5" />, description: "Configure settings for international transactions" },
    { name: "Email Templates", icon: <Mail className="h-5 w-5" />, description: "Customize email templates for various communications" },
    { name: "Audit Trail", icon: <ShieldCheck className="h-5 w-5" />, description: "Track all actions performed in the system" },
    { name: "Document Management", icon: <FileCheck className="h-5 w-5" />, description: "Upload and manage document templates" },
    { name: "Automation", icon: <Zap className="h-5 w-5" />, description: "Set up automated workflows and reminders" },
    { name: "Integrations", icon: <Share2 className="h-5 w-5" />, description: "Connect with other business applications" },
  ];

  return (
    <MainLayout title="More Features" searchPlaceholder="Search features">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">More Features</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Card key={feature.name} className="cursor-pointer hover:border-books-blue transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="bg-books-light-blue text-books-blue rounded-full p-2">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-base">{feature.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default More;
