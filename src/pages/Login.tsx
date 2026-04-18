import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import { supabase } from '@/integrations/supabase/client';
import predictvetLogo from '@/assets/predictvet-logo-r.png';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw error;

    navigate('/home');
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 pl-circuit-bg"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 20% 40%, hsl(221,73%,22%) 0%, transparent 55%),' +
          'radial-gradient(ellipse 60% 50% at 80% 60%, hsl(352,76%,18%) 0%, transparent 50%),' +
          'linear-gradient(160deg, hsl(222,77%,10%) 0%, hsl(222,77%,18%) 100%)',
      }}
    >
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        <img
          src={predictvetLogo}
          alt="PredictVet"
          className="w-72 sm:w-80 h-auto object-contain"
          style={{ filter: 'drop-shadow(0 4px 24px hsla(221,73%,45%,0.35))' }}
        />
        <LoginForm onLogin={handleLogin} />
      </div>
    </div>
  );
};

export default Login;
