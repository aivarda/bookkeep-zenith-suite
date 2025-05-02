
import { Search, RefreshCw, Bell, Settings, User, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TopbarProps {
  title?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  buttons?: React.ReactNode;
}

export const Topbar = ({
  title,
  showSearch = true,
  searchPlaceholder = "Search...",
  buttons,
}: TopbarProps) => {
  return (
    <div className="topbar">
      {title && <h1 className="text-xl font-semibold">{title}</h1>}
      
      <div className="flex-1 flex items-center mx-6">
        {showSearch && (
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={searchPlaceholder}
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        {buttons}
        <Button variant="ghost" size="icon">
          <RefreshCw className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
        <Button size="sm" className="bg-books-blue hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      </div>
    </div>
  );
};
