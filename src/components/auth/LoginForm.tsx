import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, LogIn } from 'lucide-react';

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
}

const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await onLogin(email, password);
      toast({ title: 'Bem-vindo ao PredictVet!', description: 'Login realizado com sucesso.' });
    } catch {
      toast({ title: 'Erro no login', description: 'Verifique suas credenciais e tente novamente.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="w-full max-w-md rounded-3xl overflow-hidden"
      style={{
        background: 'white',
        boxShadow: '0 24px 80px -16px hsla(221,73%,20%,0.25)',
        border: '1px solid hsl(217,50%,90%)',
      }}
    >
      {/* Top accent bar */}
      <div
        className="h-1.5"
        style={{
          background: 'linear-gradient(90deg, hsl(221,73%,45%) 0%, hsl(217,88%,57%) 60%, hsl(18,76%,50%) 100%)',
        }}
      />

      <div className="px-8 pt-8 pb-10">
        {/* Heading */}
        <div className="text-center mb-7">
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,13%)' }}
          >
            Entrar na plataforma
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'hsl(222,30%,55%)', fontFamily: 'Nunito Sans, sans-serif' }}
          >
            Acesse seu assistente veterinário
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
            >
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 rounded-xl text-sm"
              style={{
                borderColor: 'hsl(217,50%,85%)',
                fontFamily: 'Nunito Sans, sans-serif',
                background: 'hsl(213,100%,99%)',
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
            >
              Senha
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPwd ? 'text' : 'password'}
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-xl text-sm pr-10"
                style={{
                  borderColor: 'hsl(217,50%,85%)',
                  fontFamily: 'Nunito Sans, sans-serif',
                  background: 'hsl(213,100%,99%)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'hsl(222,30%,60%)' }}
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 mt-2 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, hsl(221,73%,45%) 0%, hsl(217,88%,57%) 100%)',
              boxShadow: '0 6px 24px -6px hsla(221,73%,45%,0.5)',
              fontFamily: 'Nunito Sans, sans-serif',
            }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Entrando...
              </span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Entrar
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div
          className="mt-6 text-center text-sm"
          style={{ color: 'hsl(222,30%,55%)', fontFamily: 'Nunito Sans, sans-serif' }}
        >
          Não tem uma conta?{' '}
          <Link
            to="/register"
            className="font-semibold transition-colors hover:underline"
            style={{ color: 'hsl(221,73%,45%)' }}
          >
            Registre-se
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
