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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 p-4">
      <LoginForm onLogin={handleLogin} />
    </div>
  );
};

export default Login;
