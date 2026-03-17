import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AvatarUploadProps {
  currentUrl: string | null | undefined;
  initials: string;
  onUpload: (file: File) => Promise<string>;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

const AvatarUpload = ({ currentUrl, initials, onUpload }: AvatarUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (file.size > MAX_FILE_SIZE) {
      setUploadError('A imagem deve ter no máximo 2 MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setUploadError('Selecione um arquivo de imagem válido.');
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setIsUploading(true);

    try {
      await onUpload(file);
    } catch {
      setPreview(null);
      setUploadError('Erro ao enviar a foto. Tente novamente.');
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be re-selected if needed
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const displayUrl = preview ?? currentUrl ?? undefined;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative group">
        <Avatar
          className="w-24 h-24 cursor-pointer"
          style={{ border: '3px solid hsl(221,73%,45%)' }}
          onClick={() => inputRef.current?.click()}
        >
          {displayUrl && <AvatarImage src={displayUrl} alt="Foto de perfil" className="object-cover" />}
          <AvatarFallback
            className="text-xl font-bold"
            style={{
              background: 'linear-gradient(135deg, hsl(221,73%,45%), hsl(352,76%,44%))',
              color: 'white',
              fontFamily: 'Sora, sans-serif',
            }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Camera overlay button */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center transition-all"
          style={{
            background: 'hsl(221,73%,45%)',
            border: '2px solid white',
            boxShadow: '0 2px 8px -2px hsla(221,73%,30%,0.4)',
          }}
        >
          {isUploading
            ? <Loader2 className="w-4 h-4 text-white animate-spin" />
            : <Camera className="w-4 h-4 text-white" />
          }
        </button>
      </div>

      {uploadError && (
        <p className="text-xs" style={{ color: 'hsl(352,76%,44%)', fontFamily: 'Nunito Sans, sans-serif' }}>
          {uploadError}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default AvatarUpload;
