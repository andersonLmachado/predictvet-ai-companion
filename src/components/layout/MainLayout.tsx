
import React, { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Em produção, verificar estado de autenticação

  const handleLogout = () => {
    // Simulação de logout, futuramente será integrado com Supabase Auth
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-screen">
      <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
