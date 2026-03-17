import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type ProfileRow = {
  id: string;
  full_name: string | null;
  crmv: string | null;
  clinic_name: string | null;
  specialty: string | null;
  avatar_url: string | null;
  updated_at: string | null;
};

type ProfileUpdate = {
  full_name?: string | null;
  crmv?: string | null;
  clinic_name?: string | null;
  specialty?: string | null;
  avatar_url?: string | null;
};

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setProfile(data);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateProfileData = async (data: ProfileUpdate): Promise<void> => {
    if (!user) throw new Error('Usuário não autenticado');
    setIsSaving(true);
    setError(null);

    try {
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...data,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) throw new Error(upsertError.message);

      // Sync display fields to user_metadata so Navbar reads them without extra DB query
      // supabase.auth.updateUser merges data — does not replace existing user_metadata fields
      await supabase.auth.updateUser({
        data: {
          ...(data.full_name !== undefined && { full_name: data.full_name }),
          ...(data.avatar_url !== undefined && { avatar_url: data.avatar_url }),
        },
      });

      setProfile(prev => (prev ? { ...prev, ...data } : { id: user.id, ...data, updated_at: new Date().toISOString() } as ProfileRow));
    } finally {
      setIsSaving(false);
    }
  };

  const updateAvatar = async (file: File): Promise<string> => {
    if (!user) throw new Error('Usuário não autenticado');

    setIsSaving(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      // Append cache-buster so the browser re-fetches after re-upload to the same path
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Save URL to profiles table + sync to user_metadata (isSaving already true, skip double-set)
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, avatar_url: publicUrl, updated_at: new Date().toISOString() });

      if (upsertError) throw new Error(upsertError.message);

      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });

      setProfile(prev => (prev ? { ...prev, avatar_url: publicUrl } : null));
      return publicUrl;
    } finally {
      setIsSaving(false);
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!user?.email) throw new Error('E-mail do usuário não encontrado');

    // Re-authenticate with current password to verify it
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) throw new Error('Senha atual incorreta');

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) throw new Error(updateError.message);
  };

  return {
    profile,
    isLoading,
    isSaving,
    error,
    updateProfileData,
    updateAvatar,
    updatePassword,
  };
}
