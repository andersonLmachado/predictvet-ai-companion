import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';
import predictlabLogo from '@/assets/predictlab-logo-v26.png';

interface RegisterFormProps {
  onRegister: (
    email: string,
    password: string,
    fullName: string,
    crmv: string,
    clinicName: string
  ) => Promise<void>;
}

const fieldStyle: React.CSSProperties = {
  borderColor: 'hsl(217,50%,85%)',
  fontFamily: 'Nunito Sans, sans-serif',
  background: 'hsl(213,100%,99%)',
};

const RegisterForm = ({ onRegister }: RegisterFormProps) => {
  const [fullName, setFullName]             = useState('');
  const [crmv, setCrmv]                     = useState('');
  const [clinicName, setClinicName]         = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading]           = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !crmv || !email || !password || !confirmPassword) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Senhas não coincidem', description: 'Verifique se as senhas são iguais.', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Senha muito curta', description: 'Mínimo de 6 caracteres.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await onRegister(email, password, fullName, crmv, clinicName);
      toast({ title: 'Conta criada com sucesso!', description: 'Verifique seu e-mail para confirmar o cadastro.' });
    } catch {
      toast({ title: 'Erro no registro', description: 'Ocorreu um erro. Tente novamente.', variant: 'destructive' });
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
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div
            className="px-6 py-3 rounded-2xl"
            style={{ background: 'hsl(213,100%,98%)', border: '1px solid hsl(217,50%,90%)' }}
          >
            <img src={predictlabLogo} alt="PredictVet" className="h-9 object-contain" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,13%)' }}
          >
            Criar sua conta
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'hsl(222,30%,55%)', fontFamily: 'Nunito Sans, sans-serif' }}
          >
            Registre-se e comece a usar o PredictVet
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Row: Name + CRMV */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}>
                Nome completo
              </Label>
              <Input
                type="text"
                placeholder="Dr. Ana Lima"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-10 rounded-xl text-sm"
                style={fieldStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}>
                CRMV
              </Label>
              <Input
                type="text"
                placeholder="CRMV-SP 12345"
                value={crmv}
                onChange={(e) => setCrmv(e.target.value)}
                required
                className="h-10 rounded-xl text-sm"
                style={fieldStyle}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}>
              Clínica (opcional)
            </Label>
            <Input
              type="text"
              placeholder="Nome da clínica"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className="h-10 rounded-xl text-sm"
              style={fieldStyle}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}>
              E-mail
            </Label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10 rounded-xl text-sm"
              style={fieldStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}>
                Senha
              </Label>
              <Input
                type="password"
                placeholder="Mín. 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-10 rounded-xl text-sm"
                style={fieldStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}>
                Confirmar
              </Label>
              <Input
                type="password"
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-10 rounded-xl text-sm"
                style={fieldStyle}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 mt-1 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 disabled:opacity-60"
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
                Criando conta...
              </span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Criar Conta
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div
          className="mt-5 text-center text-sm"
          style={{ color: 'hsl(222,30%,55%)', fontFamily: 'Nunito Sans, sans-serif' }}
        >
          Já tem uma conta?{' '}
          <Link
            to="/login"
            className="font-semibold transition-colors hover:underline"
            style={{ color: 'hsl(221,73%,45%)' }}
          >
            Faça login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
