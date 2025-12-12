
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChatPage from "./pages/ChatPage";
import RegisterPet from "./pages/RegisterPet";
import Patients from "./pages/Patients";
import PatientDetails from "./pages/PatientDetails";
import Exams from "./pages/Exams";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import MainLayout from "./components/layout/MainLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Rotas protegidas (com layout) */}
          <Route
            path="/chat"
            element={
              <MainLayout>
                <ChatPage />
              </MainLayout>
            }
          />
          <Route
            path="/register-pet"
            element={
              <MainLayout>
                <RegisterPet />
              </MainLayout>
            }
          />
          <Route
            path="/patients"
            element={
              <MainLayout>
                <Patients />
              </MainLayout>
            }
          />
          <Route
            path="/patient/:id"
            element={
              <MainLayout>
                <PatientDetails />
              </MainLayout>
            }
          />
          <Route
            path="/exams"
            element={
              <MainLayout>
                <Exams />
              </MainLayout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <MainLayout>
                <Dashboard />
              </MainLayout>
            }
          />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
