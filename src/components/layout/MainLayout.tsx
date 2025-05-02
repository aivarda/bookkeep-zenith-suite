
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  showTopbar?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
  topbarButtons?: React.ReactNode;
}

export const MainLayout = ({
  children,
  title,
  showTopbar = true,
  showSearch = true,
  searchPlaceholder,
  topbarButtons,
}: MainLayoutProps) => {
  return (
    <div className="books-layout">
      <Sidebar />
      <div className="books-content">
        {showTopbar && (
          <Topbar
            title={title}
            showSearch={showSearch}
            searchPlaceholder={searchPlaceholder}
            buttons={topbarButtons}
          />
        )}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};
