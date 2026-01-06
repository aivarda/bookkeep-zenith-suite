import { useState, useEffect } from "react";
import { Search, RefreshCw, Bell, Settings, LogOut, User, Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface TopbarProps {
  title?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  buttons?: React.ReactNode;
}

interface CompanySettings {
  company_name: string;
  logo_url: string | null;
}

export const Topbar = ({
  title,
  showSearch = true,
  searchPlaceholder = "Search...",
  buttons,
}: TopbarProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  
  const userInitials = user?.email 
    ? user.email.substring(0, 2).toUpperCase() 
    : "U";

  useEffect(() => {
    const fetchCompanySettings = async () => {
      const { data } = await supabase
        .from("company_settings")
        .select("company_name, logo_url")
        .limit(1)
        .single();
      
      if (data) {
        setCompanySettings(data);
      }
    };

    fetchCompanySettings();
  }, []);

  return (
    <div className="topbar">
      {/* Company Logo and Name */}
      <div className="flex items-center gap-3">
        {companySettings?.logo_url ? (
          <img 
            src={companySettings.logo_url} 
            alt="Company Logo" 
            className="h-8 w-8 object-contain rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <span className="font-semibold text-foreground hidden sm:block">
          {companySettings?.company_name || "My Company"}
        </span>
      </div>

      {title && <h1 className="text-xl font-semibold ml-4">{title}</h1>}
      
      <div className="flex-1 flex items-center mx-6">
        {showSearch && (
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              className="pl-10 bg-muted/30 border-border"
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
        <Button variant="ghost" size="icon" onClick={() => navigate("/settings/company")}>
          <Settings className="h-5 w-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">My Account</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings/company")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={signOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button size="sm" className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      </div>
    </div>
  );
};
