
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/items" element={<Items />} />
          <Route path="/banking" element={<Banking />} />
          
          {/* Sales routes */}
          <Route path="/sales" element={<Sales />} />
          <Route path="/sales/invoices" element={<Invoices />} />
          <Route path="/sales/invoices/:id" element={<NewInvoice />} />
          <Route path="/sales/estimates" element={<Estimates />} />
          <Route path="/sales/payments-received" element={<PaymentsReceived />} />
          <Route path="/sales/sales-orders" element={<SalesOrders />} />
          <Route path="/sales/delivery-challans" element={<DeliveryChallans />} />
          
          {/* Purchases routes */}
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/purchases/bills" element={<Bills />} />
          <Route path="/purchases/vendor-credits" element={<VendorCredits />} />
          <Route path="/purchases/payments-made" element={<PaymentsMade />} />
          <Route path="/purchases/purchase-orders" element={<PurchaseOrders />} />
          
          <Route path="/time-tracking" element={<TimeTracking />} />
          <Route path="/eway-bills" element={<EwayBills />} />
          <Route path="/gst-filing" element={<GSTFiling />} />
          
          {/* Accountant routes */}
          <Route path="/accountant" element={<Accountant />} />
          <Route path="/accountant/chart-of-accounts" element={<ChartOfAccounts />} />
          <Route path="/accountant/manual-journals" element={<ManualJournals />} />
          <Route path="/accountant/reconcile" element={<Reconcile />} />
          
          <Route path="/reports" element={<Reports />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/more" element={<More />} />
          
          {/* Client and Vendor management */}
          <Route path="/clients" element={<Clients />} />
          <Route path="/vendors" element={<Vendors />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
