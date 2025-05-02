
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  ShoppingBag, 
  Landmark, 
  ShoppingCart, 
  Package, 
  Clock, 
  Truck, 
  FileText, 
  User, 
  BarChart2, 
  File, 
  MoreHorizontal 
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { path: "/home", label: "Home", icon: Home },
  { path: "/items", label: "Items", icon: ShoppingBag },
  { path: "/banking", label: "Banking", icon: Landmark },
  { path: "/sales", label: "Sales", icon: ShoppingCart },
  { path: "/purchases", label: "Purchases", icon: Package },
  { path: "/time-tracking", label: "Time Tracking", icon: Clock },
  { path: "/eway-bills", label: "e-Way Bills", icon: Truck },
  { path: "/gst-filing", label: "GST Filing", icon: FileText },
  { path: "/accountant", label: "Accountant", icon: User },
  { path: "/reports", label: "Reports", icon: BarChart2 },
  { path: "/documents", label: "Documents", icon: File },
  { path: "/more", label: "More Features", icon: MoreHorizontal },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="books-sidebar">
      <div className="p-4 border-b border-white/10">
        <Link to="/home" className="flex items-center">
          <span className="text-xl font-bold text-white">Books</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {sidebarItems.map((item) => {
          const isActive = location.pathname === item.path;
          const IconComponent = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "sidebar-item",
                isActive && "active"
              )}
            >
              <IconComponent className="sidebar-item-icon" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
