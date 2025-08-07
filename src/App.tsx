import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import BrowseCakes from "./pages/BrowseCakes";
import OrderCake from "./pages/OrderCake";
import CustomerOrders from "./pages/CustomerOrders";
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerCakes from "./pages/seller/SellerCakes";
import SellerOrders from "./pages/seller/SellerOrders";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/browse" element={<BrowseCakes />} />
          <Route path="/order/:cakeId" element={<OrderCake />} />
          <Route path="/orders" element={<CustomerOrders />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/seller/cakes" element={<SellerCakes />} />
          <Route path="/seller/orders" element={<SellerOrders />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
