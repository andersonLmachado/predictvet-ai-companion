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
        },
      },
    });

    if (error) throw error;

    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 p-4">
      <RegisterForm onRegister={handleRegister} />
    </div>
  );
};

export default Register;
