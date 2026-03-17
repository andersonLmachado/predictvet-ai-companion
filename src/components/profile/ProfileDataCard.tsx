import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, UserCircle, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AvatarUpload from './AvatarUpload';

interface ProfileDataCardProps {
  profile: {
    full_name: string | null;
    crmv: string | null;
    clinic_name: string | null;
    specialty: string | null;
    avatar_url: string | null;
  } | null;
  userInitials: string;
  isWelcome: boolean;
  isSaving: boolean;
  onSave: (data: {
    full_name: string;
    crmv: string;
    clinic_name: string;
    specialty: string;
    avatar_url?: string | null;
  }) => Promise<void>;
  onAvatarUpload: (file: File) => Promise<string>;
}

const ProfileDataCard = ({
  profile,
  userInitials,
  isWelcome,
  isSaving,
  onSave,
  onAvatarUpload,
}: ProfileDataCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [crmv, setCrmv] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSkipping, setIsSkipping] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setCrmv(profile.crmv ?? '');
      setClinicName(profile.clinic_name ?? '');
      setSpecialty(profile.specialty ?? '');
      setAvatarUrl(profile.avatar_url ?? null);
    }
  }, [profile]);

  const handleAvatarUpload = async (file: File): Promise<string> => {
    const url = await onAvatarUpload(file);
    setAvatarUrl(url);
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast({ title: 'Nome obrigatório', description: 'Preencha seu nome completo.', variant: 'destructive' });
      return;
    }
    if (!crmv.trim()) {
      toast({ title: 'CRMV obrigatório', description: 'Preencha seu número de CRMV.', variant: 'destructive' });
      return;
    }

    try {
      await onSave({ full_name: fullName, crmv, clinic_name: clinicName, specialty, avatar_url: avatarUrl });

      if (isWelcome) {
        await markOnboardingComplete();
      } else {
        toast({ title: 'Perfil atualizado', description: 'Seus dados foram salvos com sucesso.' });
      }
    } catch (err) {
      toast({
        title: 'Erro ao salvar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const markOnboardingComplete = async () => {
    const { error } = await supabase.auth.updateUser({
      data: { onboarding_complete: true },
    });
    if (error) {
      toast({
        title: 'Erro ao finalizar onboarding',
        description: 'Não foi possível confirmar o cadastro. Tente novamente.',
        variant: 'destructive',
      });
      return;
    }
    navigate('/home');
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    const { error } = await supabase.auth.updateUser({
      data: { onboarding_complete: true },
    });
    setIsSkipping(false);
    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível continuar. Tente novamente.',
        variant: 'destructive',
      });
      return;
    }
    navigate('/home');
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'white',
        border: '1px solid hsl(217,50%,90%)',
        boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.1)',
      }}
    >
      {/* Colored top stripe */}
      <div className="h-1" style={{ background: 'hsl(221,73%,45%)' }} />

      {/* Welcome banner for new users */}
      {isWelcome && (
        <div
          className="flex items-start gap-3 px-6 py-3"
          style={{
            background: 'hsl(38,88%,97%)',
            borderBottom: '1px solid hsl(38,88%,88%)',
          }}
        >
          <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'hsl(38,88%,45%)' }} />
          <p className="text-sm" style={{ color: 'hsl(38,60%,30%)', fontFamily: 'Nunito Sans, sans-serif' }}>
            Bem-vindo ao PredictLab! Complete seus dados profissionais para personalizar sua experiência.
          </p>
        </div>
      )}

      {/* Card header */}
      <div
        className="px-6 py-4 border-b flex items-center gap-2"
        style={{ borderColor: 'hsl(217,50%,93%)' }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: 'linear-gradient(135deg, hsl(221,73%,45%), hsl(18,76%,50%))' }}
        />
        <h2
          className="text-sm font-semibold"
          style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}
        >
          Dados Profissionais
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <AvatarUpload
              currentUrl={avatarUrl}
              initials={userInitials}
              onUpload={handleAvatarUpload}
            />
            <p
              className="text-xs text-center"
              style={{ color: 'hsl(222,30%,55%)', fontFamily: 'Nunito Sans, sans-serif', maxWidth: '96px' }}
            >
              Foto de perfil<br />(opcional)
            </p>
          </div>

          {/* Fields */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
              >
                Nome completo <span style={{ color: 'hsl(352,76%,44%)' }}>*</span>
              </Label>
              <Input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Dr. João Silva"
                className="h-11 rounded-xl text-sm"
                style={{
                  borderColor: 'hsl(217,50%,85%)',
                  fontFamily: 'Nunito Sans, sans-serif',
                  background: 'hsl(213,100%,99%)',
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
              >
                CRMV <span style={{ color: 'hsl(352,76%,44%)' }}>*</span>
              </Label>
              <Input
                value={crmv}
                onChange={e => setCrmv(e.target.value)}
                placeholder="SP-12345"
                className="h-11 rounded-xl text-sm"
                style={{
                  borderColor: 'hsl(217,50%,85%)',
                  fontFamily: 'Nunito Sans, sans-serif',
                  background: 'hsl(213,100%,99%)',
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
              >
                Clínica / Hospital
              </Label>
              <Input
                value={clinicName}
                onChange={e => setClinicName(e.target.value)}
                placeholder="Clínica VetCare (opcional)"
                className="h-11 rounded-xl text-sm"
                style={{
                  borderColor: 'hsl(217,50%,85%)',
                  fontFamily: 'Nunito Sans, sans-serif',
                  background: 'hsl(213,100%,99%)',
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
              >
                Especialidade
              </Label>
              <Input
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                placeholder="Ex: Clínica geral, Cirurgia..."
                className="h-11 rounded-xl text-sm"
                style={{
                  borderColor: 'hsl(217,50%,85%)',
                  fontFamily: 'Nunito Sans, sans-serif',
                  background: 'hsl(213,100%,99%)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid hsl(217,50%,93%)' }}>
          {isWelcome ? (
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSkipping}
              className="text-sm transition-colors"
              style={{ color: 'hsl(222,30%,55%)', fontFamily: 'Nunito Sans, sans-serif' }}
            >
              {isSkipping ? 'Aguarde...' : 'Pular por agora'}
            </button>
          ) : (
            <span />
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, hsl(221,73%,45%) 0%, hsl(217,88%,57%) 100%)',
              boxShadow: '0 6px 24px -6px hsla(221,73%,45%,0.5)',
              fontFamily: 'Nunito Sans, sans-serif',
            }}
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            <UserCircle className="w-4 h-4" />
            {isWelcome ? 'Salvar e Continuar' : 'Salvar Dados'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileDataCard;
