
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Auth
import Auth from "./pages/Auth";

// Main pages
import Home from "./pages/Home";
import Items from "./pages/Items";
import Banking from "./pages/Banking";
import Sales from "./pages/Sales";
import Purchases from "./pages/Purchases";
import TimeTracking from "./pages/TimeTracking";
import EwayBills from "./pages/EwayBills";
import GSTFiling from "./pages/GSTFiling";
import Accountant from "./pages/Accountant";
import Reports from "./pages/Reports";

// Reports submenu routes
import ProfitAndLoss from "./pages/reports/ProfitAndLoss";
import BalanceSheet from "./pages/reports/BalanceSheet";
import ReceivablesAging from "./pages/reports/ReceivablesAging";
import PayablesAging from "./pages/reports/PayablesAging";
import Documents from "./pages/Documents";
import More from "./pages/More";
import NotFound from "./pages/NotFound";

// Accountant submenu routes
import ChartOfAccounts from "./pages/accountant/ChartOfAccounts";
import ManualJournals from "./pages/accountant/ManualJournals";
import Reconcile from "./pages/accountant/Reconcile";

// Sales submenu routes
import Invoices from "./pages/sales/Invoices";
import NewInvoice from "./pages/sales/NewInvoice";
import InvoiceView from "./pages/sales/InvoiceView";
import Estimates from "./pages/sales/Estimates";
import PaymentsReceived from "./pages/sales/PaymentsReceived";
import SalesOrders from "./pages/sales/SalesOrders";
import DeliveryChallans from "./pages/sales/DeliveryChallans";

// Purchases submenu routes
import Bills from "./pages/purchases/Bills";
import VendorCredits from "./pages/purchases/VendorCredits";
import PaymentsMade from "./pages/purchases/PaymentsMade";
import PurchaseOrders from "./pages/purchases/PurchaseOrders";

// Client and Vendor management
import Clients from "./pages/clients/Clients";
import Vendors from "./pages/vendors/Vendors";

// Settings
import CompanySettings from "./pages/settings/CompanySettings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/items" element={<ProtectedRoute><Items /></ProtectedRoute>} />
            <Route path="/banking" element={<ProtectedRoute><Banking /></ProtectedRoute>} />
            
            {/* Sales routes */}
            <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
            <Route path="/sales/customers" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
            <Route path="/sales/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="/sales/invoices/new" element={<ProtectedRoute><NewInvoice /></ProtectedRoute>} />
            <Route path="/sales/invoices/:id" element={<ProtectedRoute><InvoiceView /></ProtectedRoute>} />
            <Route path="/sales/invoices/:id/edit" element={<ProtectedRoute><NewInvoice /></ProtectedRoute>} />
            <Route path="/sales/estimates" element={<ProtectedRoute><Estimates /></ProtectedRoute>} />
            <Route path="/sales/payments-received" element={<ProtectedRoute><PaymentsReceived /></ProtectedRoute>} />
            <Route path="/sales/sales-orders" element={<ProtectedRoute><SalesOrders /></ProtectedRoute>} />
            <Route path="/sales/delivery-challans" element={<ProtectedRoute><DeliveryChallans /></ProtectedRoute>} />
            
            {/* Purchases routes */}
            <Route path="/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
            <Route path="/purchases/vendors" element={<ProtectedRoute><Vendors /></ProtectedRoute>} />
            <Route path="/purchases/bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
            <Route path="/purchases/vendor-credits" element={<ProtectedRoute><VendorCredits /></ProtectedRoute>} />
            <Route path="/purchases/payments-made" element={<ProtectedRoute><PaymentsMade /></ProtectedRoute>} />
            <Route path="/purchases/purchase-orders" element={<ProtectedRoute><PurchaseOrders /></ProtectedRoute>} />
            
            <Route path="/time-tracking" element={<ProtectedRoute><TimeTracking /></ProtectedRoute>} />
            <Route path="/eway-bills" element={<ProtectedRoute><EwayBills /></ProtectedRoute>} />
            <Route path="/gst-filing" element={<ProtectedRoute><GSTFiling /></ProtectedRoute>} />
            
            {/* Accountant routes */}
            <Route path="/accountant" element={<ProtectedRoute><Accountant /></ProtectedRoute>} />
            <Route path="/accountant/chart-of-accounts" element={<ProtectedRoute><ChartOfAccounts /></ProtectedRoute>} />
            <Route path="/accountant/manual-journals" element={<ProtectedRoute><ManualJournals /></ProtectedRoute>} />
            <Route path="/accountant/reconcile" element={<ProtectedRoute><Reconcile /></ProtectedRoute>} />
            
            {/* Reports routes */}
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/reports/profit-and-loss" element={<ProtectedRoute><ProfitAndLoss /></ProtectedRoute>} />
            <Route path="/reports/balance-sheet" element={<ProtectedRoute><BalanceSheet /></ProtectedRoute>} />
            <Route path="/reports/receivables-aging" element={<ProtectedRoute><ReceivablesAging /></ProtectedRoute>} />
            <Route path="/reports/payables-aging" element={<ProtectedRoute><PayablesAging /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
            <Route path="/more" element={<ProtectedRoute><More /></ProtectedRoute>} />
            
            {/* Settings routes */}
            <Route path="/settings/company" element={<ProtectedRoute><CompanySettings /></ProtectedRoute>} />
            
            {/* Client and Vendor management */}
            <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
            <Route path="/vendors" element={<ProtectedRoute><Vendors /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
