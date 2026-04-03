import React, { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import Navbar from './Navbar';
import { useTour } from '@/hooks/useTour';
import { resetTour } from '@/lib/onboardingTour';

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

  const { startTour } = useTour();

  const handleTourRestart = () => {
    resetTour();
    startTour();
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
      {isAuthenticated && (
        <button
          onClick={handleTourRestart}
          title="Refazer o tour"
          className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-opacity hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, hsl(221,73%,45%), hsl(217,88%,57%))',
            boxShadow: '0 4px 16px -2px hsla(221,73%,30%,0.4)',
          }}
        >
          <HelpCircle className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );
};

export default MainLayout;
