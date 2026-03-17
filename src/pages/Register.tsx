import { useNavigate } from 'react-router-dom';
import RegisterForm from '@/components/auth/RegisterForm';
import { supabase } from '@/integrations/supabase/client';

const Register = () => {
  const navigate = useNavigate();

  const handleRegister = async (
    email: string,
    password: string,
    fullName: string,
    crmv: string,
    clinicName: string
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          crmv: crmv,
          clinic_name: clinicName,
          onboarding_complete: false,
        },
      },
    });

    if (error) throw error;

    navigate('/login');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 pl-circuit-bg"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 80% 40%, hsl(221,73%,22%) 0%, transparent 55%),' +
          'radial-gradient(ellipse 60% 50% at 20% 60%, hsl(352,76%,18%) 0%, transparent 50%),' +
          'linear-gradient(160deg, hsl(222,77%,10%) 0%, hsl(222,77%,18%) 100%)',
      }}
    >
      <RegisterForm onRegister={handleRegister} />
    </div>
  );
};

export default Register;
