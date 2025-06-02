
import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    // Simulação de login, futuramente será integrado com Supabase Auth
    console.log('Login com:', email, password);
    
    // Para fins de demonstração, simular um login bem-sucedido
    await new Promise(resolve => setTimeout(resolve, 800));
    navigate('/chat');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 p-4">
      <LoginForm onLogin={handleLogin} />
    </div>
  );
};

export default Login;
