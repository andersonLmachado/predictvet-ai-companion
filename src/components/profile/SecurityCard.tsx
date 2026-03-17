import { useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface SecurityCardProps {
  onPasswordUpdate: (current: string, newPass: string) => Promise<void>;
}

const SecurityCard = ({ onPasswordUpdate }: SecurityCardProps) => {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);

    if (!currentPassword) {
      setInlineError('Informe sua senha atual.');
      return;
    }
    if (newPassword.length < 6) {
      setInlineError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setInlineError('As senhas não coincidem.');
      return;
    }

    setIsSaving(true);
    try {
      await onPasswordUpdate(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: 'Senha atualizada', description: 'Sua senha foi alterada com sucesso.' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao alterar senha.';
      setInlineError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle = {
    borderColor: 'hsl(217,50%,85%)',
    fontFamily: 'Nunito Sans, sans-serif',
    background: 'hsl(213,100%,99%)',
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
      {/* Colored top stripe — crimson for security */}
      <div className="h-1" style={{ background: 'hsl(352,76%,44%)' }} />

      {/* Card header */}
      <div
        className="px-6 py-4 border-b flex items-center gap-2"
        style={{ borderColor: 'hsl(217,50%,93%)' }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: 'linear-gradient(135deg, hsl(352,76%,44%), hsl(18,76%,50%))' }}
        />
        <h2
          className="text-sm font-semibold"
          style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}
        >
          Segurança
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="flex flex-col gap-4 max-w-sm">
          <div className="flex flex-col gap-1.5">
            <Label
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
            >
              Senha atual
            </Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 rounded-xl text-sm"
              style={inputStyle}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
            >
              Nova senha
            </Label>
            <Input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="h-11 rounded-xl text-sm"
              style={inputStyle}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
            >
              Confirmar nova senha
            </Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              className="h-11 rounded-xl text-sm"
              style={inputStyle}
            />
          </div>

          {inlineError && (
            <p
              className="text-sm"
              style={{ color: 'hsl(352,76%,44%)', fontFamily: 'Nunito Sans, sans-serif' }}
            >
              {inlineError}
            </p>
          )}
        </div>

        <div className="flex justify-end mt-6 pt-4" style={{ borderTop: '1px solid hsl(217,50%,93%)' }}>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, hsl(352,76%,44%) 0%, hsl(18,76%,50%) 100%)',
              boxShadow: '0 6px 24px -6px hsla(352,76%,44%,0.4)',
              fontFamily: 'Nunito Sans, sans-serif',
            }}
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            <ShieldCheck className="w-4 h-4" />
            Atualizar Senha
          </button>
        </div>
      </form>
    </div>
  );
};

export default SecurityCard;
