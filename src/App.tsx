
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
          <Route path="/sales" element={<Sales />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/time-tracking" element={<TimeTracking />} />
          <Route path="/eway-bills" element={<EwayBills />} />
          <Route path="/gst-filing" element={<GSTFiling />} />
          <Route path="/accountant" element={<Accountant />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/more" element={<More />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
