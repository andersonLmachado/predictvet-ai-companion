
import React from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from '@/components/auth/RegisterForm';

const Register = () => {
  const navigate = useNavigate();

  const handleRegister = async (email: string, password: string) => {
    // Simulação de registro, futuramente será integrado com Supabase Auth
    console.log('Registro com:', email, password);
    
    // Para fins de demonstração, simular um registro bem-sucedido
    await new Promise(resolve => setTimeout(resolve, 800));
    navigate('/chat');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 p-4">
      <RegisterForm onRegister={handleRegister} />
    </div>
  );
};

export default Register;
