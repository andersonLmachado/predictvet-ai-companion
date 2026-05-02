import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ClipboardList,
  UserPlus,
  Users,
  FileText,
  LogOut,
  LayoutDashboard,
  Home,
  Menu,
  X,
  ChevronDown,
  User,
  ScanLine,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import predictlabIcon from '@/assets/predictlab-icon-new.png';

interface NavbarProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

export const NAV_ITEMS = [
  { label: 'Home',             icon: Home,            path: '/home' },
  { label: 'Cadastrar Pet',    icon: UserPlus,        path: '/register-pet', tourId: 'nav-register-pet' },
  { label: 'Meus Pacientes',   icon: Users,           path: '/patients' },
  { label: 'Consulta Guiada',  icon: ClipboardList,   path: '/chat',         tourId: 'nav-chat' },
  { label: 'Exames',           icon: FileText,        path: '/exams',        tourId: 'nav-exams' },
  { label: 'Laudo US',         icon: ScanLine,        path: '/ultrasound',   tourId: 'nav-ultrasound' },
  { label: 'Comparativo',      icon: LayoutDashboard, path: '/dashboard',    tourId: 'nav-dashboard' },
];

const Navbar = ({ isAuthenticated = false, onLogout }: NavbarProps) => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    onLogout?.();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  const initials = (() => {
    const name = user?.user_metadata?.full_name as string | undefined;
    if (name) {
      const parts = name.trim().split(' ');
      return parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();
    }
    return user?.email?.slice(0, 2).toUpperCase() ?? 'VT';
  })();

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <>
      {/* ── Desktop Navbar ── */}
      <nav
        className="sticky top-0 z-50 hidden md:flex items-center justify-between h-16 px-6 lg:px-8 pl-circuit-bg"
        style={{
          background: 'linear-gradient(135deg, hsl(222,77%,12%) 0%, hsl(222,77%,18%) 60%, hsl(221,73%,22%) 100%)',
          borderBottom: '1px solid hsla(217,88%,57%,0.15)',
          boxShadow: '0 2px 20px -4px hsla(221,73%,10%,0.6)',
        }}
      >
        {/* Brand */}
        <Link to="/home" className="flex items-center gap-2.5 shrink-0 group">
          <span
            className="text-lg font-bold tracking-tight"
            style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(213,100%,97%)' }}
          >
            PredictVet
          </span>
          <img
            src={predictlabIcon}
            alt="PredictVet"
            className="w-8 h-8 object-contain"
          />
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-0.5">
          {NAV_ITEMS.map(({ label, icon: Icon, path, tourId }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path}>
                <button
                  {...(tourId ? { 'data-tour': tourId } : {})}
                  className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    fontFamily: 'Nunito Sans, sans-serif',
                    color: active ? 'hsl(217,90%,72%)' : 'hsla(213,100%,95%,0.65)',
                    background: active ? 'hsla(217,88%,57%,0.18)' : 'transparent',
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = 'hsl(213,100%,95%)';
                    if (!active) (e.currentTarget as HTMLElement).style.background = 'hsla(217,88%,57%,0.1)';
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = 'hsla(213,100%,95%,0.65)';
                    if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                  {active && (
                    <span
                      className="absolute bottom-0.5 left-3 right-3 h-0.5 rounded-full"
                      style={{ background: 'linear-gradient(90deg, hsl(221,73%,55%), hsl(18,76%,50%))' }}
                    />
                  )}
                </button>
              </Link>
            );
          })}
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors duration-200"
              style={{ background: 'hsla(0,0%,100%,0.06)', border: '1px solid hsla(217,88%,57%,0.2)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'hsla(0,0%,100%,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'hsla(0,0%,100%,0.06)')}
            >
              <Avatar className="h-7 w-7">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={initials} className="object-cover" />}
                <AvatarFallback
                  className="text-xs font-bold"
                  style={{
                    background: 'linear-gradient(135deg, hsl(221,73%,45%), hsl(352,76%,44%))',
                    color: 'white',
                    fontFamily: 'Sora, sans-serif',
                  }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="w-3.5 h-3.5" style={{ color: 'hsla(213,100%,95%,0.5)' }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-48"
            align="end"
            style={{
              background: 'hsl(222,77%,14%)',
              border: '1px solid hsla(217,88%,57%,0.2)',
              color: 'hsl(213,100%,92%)',
            }}
          >
            <div className="px-3 py-2">
              <p className="text-xs font-medium" style={{ color: 'hsla(213,100%,85%,0.6)', fontFamily: 'Nunito Sans, sans-serif' }}>
                Logado como
              </p>
              <p className="text-sm font-semibold truncate" style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(213,100%,95%)' }}>
                {user?.user_metadata?.full_name ?? user?.email ?? 'Veterinário'}
              </p>
            </div>
            <DropdownMenuSeparator style={{ background: 'hsla(217,88%,57%,0.15)' }} />
            <DropdownMenuItem
              onClick={() => navigate('/perfil')}
              className="cursor-pointer flex items-center gap-2 text-sm"
              style={{ color: 'hsl(213,100%,88%)', fontFamily: 'Nunito Sans, sans-serif' }}
            >
              <User className="w-4 h-4" />
              <span>Meu Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator style={{ background: 'hsla(217,88%,57%,0.15)' }} />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer flex items-center gap-2 text-sm"
              style={{ color: 'hsl(352,76%,65%)', fontFamily: 'Nunito Sans, sans-serif' }}
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da conta</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      {/* ── Mobile Navbar ── */}
      <nav
        className="sticky top-0 z-50 md:hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(222,77%,12%) 0%, hsl(222,77%,18%) 100%)',
          borderBottom: '1px solid hsla(217,88%,57%,0.15)',
          boxShadow: '0 2px 16px -4px hsla(221,73%,10%,0.6)',
        }}
      >
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/home" className="flex items-center gap-2">
            <span
              className="text-base font-bold"
              style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(213,100%,97%)' }}
            >
              PredictVet
            </span>
            <img src={predictlabIcon} alt="PredictVet" className="w-7 h-7 object-contain" />
          </Link>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'hsl(213,100%,85%)', background: 'hsla(0,0%,100%,0.06)' }}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu Panel */}
        {mobileOpen && (
          <div
            className="border-t py-3 px-4 space-y-1"
            style={{ borderColor: 'hsla(217,88%,57%,0.15)', background: 'hsl(222,77%,13%)' }}
          >
            {NAV_ITEMS.map(({ label, icon: Icon, path, tourId }) => {
              const active = location.pathname === path;
              return (
                <Link key={path} to={path} onClick={() => setMobileOpen(false)}>
                  <div
                    {...(tourId ? { 'data-tour': `${tourId}-mobile` } : {})}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      color: active ? 'hsl(217,90%,72%)' : 'hsla(213,100%,90%,0.7)',
                      background: active ? 'hsla(217,88%,57%,0.18)' : 'transparent',
                      fontFamily: 'Nunito Sans, sans-serif',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </div>
                </Link>
              );
            })}
            <div style={{ borderTop: '1px solid hsla(217,88%,57%,0.15)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => { navigate('/perfil'); setMobileOpen(false); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full"
                style={{ color: 'hsla(213,100%,90%,0.7)', fontFamily: 'Nunito Sans, sans-serif' }}
              >
                <User className="w-4 h-4" />
                Meu Perfil
              </button>
              <button
                onClick={() => { handleLogout(); setMobileOpen(false); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full"
                style={{ color: 'hsl(352,76%,65%)', fontFamily: 'Nunito Sans, sans-serif' }}
              >
                <LogOut className="w-4 h-4" />
                Sair da conta
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
