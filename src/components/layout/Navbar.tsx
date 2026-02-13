
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ClipboardList, UserPlus, Users, FileText, LogOut, LayoutDashboard } from 'lucide-react';
import predictlabIcon from '@/assets/predictlab-icon.png';

interface NavbarProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

const Navbar = ({ isAuthenticated = false, onLogout }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout?.();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/chat" className="flex items-center space-x-2">
              <img src={predictlabIcon} alt="PredictLab" className="w-10 h-10 object-contain" />
              <span className="text-xl font-bold text-gray-900">PredictLab</span>
            </Link>
            
            <div className="flex space-x-1">
              <Link to="/chat">
                <Button 
                  variant={location.pathname === '/chat' ? 'default' : 'ghost'}
                  className="flex items-center space-x-2"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Consulta Guiada</span>
                </Button>
              </Link>
              
              <Link to="/register-pet">
                <Button 
                  variant={location.pathname === '/register-pet' ? 'default' : 'ghost'}
                  className="flex items-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Cadastrar Pet</span>
                </Button>
              </Link>
              
              <Link to="/patients">
                <Button 
                  variant={location.pathname === '/patients' ? 'default' : 'ghost'}
                  className="flex items-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Meus Pacientes</span>
                </Button>
              </Link>
              
              <Link to="/exams">
                <Button 
                  variant={location.pathname === '/exams' ? 'default' : 'ghost'}
                  className="flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Exames</span>
                </Button>
              </Link>
              
              <Link to="/dashboard">
                <Button 
                  variant={location.pathname === '/dashboard' ? 'default' : 'ghost'}
                  className="flex items-center space-x-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      Dr
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
