import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!session) return <Navigate to="/login" replace />;

  // Redirect new users to profile completion page on first login
  const isNew = session.user.user_metadata?.onboarding_complete === false;
  const isAlreadyOnProfile = location.pathname === '/perfil';
  if (isNew && !isAlreadyOnProfile) {
    return <Navigate to="/perfil?welcome=1" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
