import React, { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const handleLogout = () => {
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-screen">
      <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      
      {/* ALTERAÇÃO AQUI: 
         Troquei 'overflow-hidden' por 'overflow-y-auto'.
         Isso cria uma barra de rolagem vertical apenas na área de conteúdo
         quando ela for maior que o espaço disponível.
      */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
