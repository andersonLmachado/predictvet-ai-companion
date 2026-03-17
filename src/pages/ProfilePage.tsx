import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import ProfileDataCard from '@/components/profile/ProfileDataCard';
import SecurityCard from '@/components/profile/SecurityCard';

const ProfilePage = () => {
  const [searchParams] = useSearchParams();
  const isWelcome = searchParams.get('welcome') === '1';

  const { user } = useAuth();
  const { profile, isLoading, isSaving, updateProfileData, updateAvatar, updatePassword } = useProfile();

  const initials = (() => {
    const name = user?.user_metadata?.full_name as string | undefined;
    if (name) {
      const parts = name.trim().split(' ');
      return parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();
    }
    return user?.email?.slice(0, 2).toUpperCase() ?? 'VT';
  })();

  return (
    <div className="min-h-screen" style={{ background: 'hsl(213,100%,98%)' }}>
      {/* Dark header banner */}
      <div
        className="pl-circuit-bg"
        style={{
          background: 'linear-gradient(135deg, hsl(222,77%,12%) 0%, hsl(222,77%,18%) 60%, hsl(221,73%,22%) 100%)',
          borderBottom: '1px solid hsla(217,88%,57%,0.15)',
          boxShadow: '0 2px 20px -4px hsla(221,73%,10%,0.6)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(213,100%,97%)' }}
          >
            Meu Perfil
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'hsla(213,100%,85%,0.55)', fontFamily: 'Nunito Sans, sans-serif' }}
          >
            Gerencie seus dados profissionais e segurança da conta
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {isLoading ? (
          <div className="py-14 flex flex-col items-center gap-3">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{
                borderRightColor: 'hsl(221,73%,45%)',
                borderBottomColor: 'hsl(221,73%,45%)',
                borderLeftColor: 'hsl(221,73%,45%)',
              }}
            />
            <p className="text-sm" style={{ color: 'hsl(222,30%,60%)', fontFamily: 'Nunito Sans, sans-serif' }}>
              Carregando perfil...
            </p>
          </div>
        ) : (
          <>
            <ProfileDataCard
              profile={profile}
              userInitials={initials}
              isWelcome={isWelcome}
              isSaving={isSaving}
              onSave={updateProfileData}
              onAvatarUpload={updateAvatar}
            />
            <SecurityCard onPasswordUpdate={updatePassword} />
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
