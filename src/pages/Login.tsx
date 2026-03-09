import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw error;

    navigate('/home');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 pl-circuit-bg"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 20% 40%, hsl(221,73%,22%) 0%, transparent 55%),' +
          'radial-gradient(ellipse 60% 50% at 80% 60%, hsl(352,76%,18%) 0%, transparent 50%),' +
          'linear-gradient(160deg, hsl(222,77%,10%) 0%, hsl(222,77%,18%) 100%)',
      }}
    >
      <LoginForm onLogin={handleLogin} />
    </div>
  );
};

export default Login;
