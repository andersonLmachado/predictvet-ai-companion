
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PatientProvider } from "@/contexts/PatientContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChatPage from "./pages/ChatPage";
import RegisterPet from "./pages/RegisterPet";
import Patients from "./pages/Patients";
import PatientDetails from "./pages/PatientDetails";
import Exams from "./pages/Exams";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import DischargeSummary from "./pages/DischargeSummary";
import ConsultationPage from "./pages/ConsultationPage";
import ProfilePage from "./pages/ProfilePage";
import UltrasoundPage from './pages/UltrasoundPage';
import MainLayout from "./components/layout/MainLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PatientProvider>
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
                path="/home"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Home />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ChatPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/register-pet"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <RegisterPet />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patients"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Patients />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/:id"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <PatientDetails />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/paciente/:id/relatorio-alta"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <DischargeSummary />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exams"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Exams />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/anamnese"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ConsultationPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/anamnese/:patientId"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ConsultationPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/:id/ultrasound"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <UltrasoundPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/perfil"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ProfilePage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </PatientProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
