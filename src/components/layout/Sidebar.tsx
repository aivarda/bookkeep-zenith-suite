
import { Link, NavLink, useLocation } from "react-router-dom";
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
  MoreHorizontal,
  ChevronDown,
  CreditCard,
  ClipboardList,
  Receipt,
  DollarSign,
  BookOpen,
  BarChart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SubMenuItem {
  path: string;
  label: string;
  icon: React.FC<{ className?: string }>;
}

interface SidebarItem {
  path: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  submenu?: SubMenuItem[];
}

const sidebarItems: SidebarItem[] = [
  { path: "/home", label: "Home", icon: Home },
  { path: "/items", label: "Items", icon: ShoppingBag },
  { path: "/banking", label: "Banking", icon: Landmark },
  { 
    path: "/sales", 
    label: "Sales", 
    icon: ShoppingCart,
    submenu: [
      { path: "/sales/estimates", label: "Estimates", icon: FileText },
      { path: "/sales/invoices", label: "Invoices", icon: FileText },
      { path: "/sales/payments-received", label: "Payments Received", icon: CreditCard },
      { path: "/sales/sales-orders", label: "Sales Orders", icon: ClipboardList },
      { path: "/sales/delivery-challans", label: "Delivery Challans", icon: Truck }
    ]
  },
  { 
    path: "/purchases", 
    label: "Purchases", 
    icon: Package,
    submenu: [
      { path: "/purchases/bills", label: "Bills", icon: Receipt },
      { path: "/purchases/vendor-credits", label: "Vendor Credits", icon: CreditCard },
      { path: "/purchases/payments-made", label: "Payments Made", icon: DollarSign },
      { path: "/purchases/purchase-orders", label: "Purchase Orders", icon: ClipboardList }
    ]
  },
  { path: "/time-tracking", label: "Time Tracking", icon: Clock },
  { path: "/eway-bills", label: "e-Way Bills", icon: Truck },
  { path: "/gst-filing", label: "GST Filing", icon: FileText },
  { 
    path: "/accountant", 
    label: "Accountant", 
    icon: User,
    submenu: [
      { path: "/accountant/chart-of-accounts", label: "Chart of Accounts", icon: BookOpen },
      { path: "/accountant/manual-journals", label: "Manual Journals", icon: BookOpen },
      { path: "/accountant/reconcile", label: "Reconcile", icon: BarChart }
    ]
  },
  { path: "/reports", label: "Reports", icon: BarChart2 },
  { path: "/documents", label: "Documents", icon: File },
  { path: "/more", label: "More Features", icon: MoreHorizontal },
];

export const Sidebar = () => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const toggleSubmenu = (path: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Check if the current path is in a submenu of an item
  const isInSubmenu = (item: SidebarItem) => {
    if (!item.submenu) return false;
    return item.submenu.some(subitem => location.pathname.startsWith(subitem.path));
  };

  return (
    <aside className="books-sidebar">
      <div className="p-4 border-b border-white/10">
        <Link to="/home" className="flex items-center">
          <span className="text-xl font-bold text-white">Books</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {sidebarItems.map((item) => {
          const isActive = location.pathname === item.path || isInSubmenu(item);
          const isExpanded = expandedMenus[item.path] || isInSubmenu(item);
          const IconComponent = item.icon;
          
          return (
            <div key={item.path} className="mb-1">
              {item.submenu ? (
                // Menu with submenu
                <>
                  <button
                    onClick={() => toggleSubmenu(item.path)}
                    className={cn(
                      "sidebar-item w-full flex items-center justify-between",
                      isActive && "active"
                    )}
                  >
                    <div className="flex items-center">
                      <IconComponent className="sidebar-item-icon" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown 
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isExpanded && "transform rotate-180"
                      )} 
                    />
                  </button>
                  
                  {/* Submenu items */}
                  {isExpanded && (
                    <div className="pl-10 mt-1 space-y-1">
                      {item.submenu.map((subitem) => {
                        const isSubActive = location.pathname.startsWith(subitem.path);
                        const SubIconComponent = subitem.icon;
                        
                        return (
                          <NavLink
                            key={subitem.path}
                            to={subitem.path}
                            className={({ isActive }) => cn(
                              "sidebar-subitem",
                              isActive && "active"
                            )}
                          >
                            <SubIconComponent className="sidebar-subitem-icon" />
                            <span>{subitem.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                // Regular menu item without submenu
                <Link
                  to={item.path}
                  className={cn(
                    "sidebar-item",
                    isActive && "active"
                  )}
                >
                  <IconComponent className="sidebar-item-icon" />
                  <span>{item.label}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};
