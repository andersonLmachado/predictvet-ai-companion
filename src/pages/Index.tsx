
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redireciona para a página de login
    navigate('/login');
  }, [navigate]);

  return <div>Redirecionando...</div>;
};

export default Index;
