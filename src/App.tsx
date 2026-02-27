import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import ResellerDashboard from "./pages/ResellerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Academy from "./pages/Academy";
import Pacotes from "./pages/Pacotes";
import Licencas from "./pages/Licencas";
import MyOrders from "./pages/MyOrders";
import HelpCenter from "./pages/HelpCenter";
import NotFound from "./pages/NotFound";
import LoadingScreen from "./components/ui/LoadingScreen";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const DashboardRouter = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <ResellerDashboard />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<DashboardRouter />} />
            <Route path="/academy" element={<Academy />} />
            <Route path="/pacotes" element={<Pacotes />} />
            <Route path="/licencas" element={<Licencas />} />
            <Route path="/pedidos" element={<MyOrders />} />
            <Route path="/ajuda" element={<HelpCenter />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
