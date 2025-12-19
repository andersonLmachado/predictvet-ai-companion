import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileImage, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  acceptedTypes?: string;
}

export const FileDropzone = ({ 
  onFileSelect, 
  isLoading = false,
  acceptedTypes = "image/*,.pdf" 
}: FileDropzoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <FileImage className="h-8 w-8 text-primary" />;
    }
    return <FileText className="h-8 w-8 text-primary" />;
  };

  if (selectedFile && !isLoading) {
    return (
      <Card className="border-2 border-dashed border-primary/50 bg-primary/5">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            {getFileIcon(selectedFile)}
            <div>
              <p className="font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={clearFile}
            className="p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "border-2 border-dashed transition-all duration-200 cursor-pointer",
        isDragOver 
          ? "border-primary bg-primary/10 scale-[1.02]" 
          : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50",
        isLoading && "pointer-events-none opacity-50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="flex flex-col items-center justify-center py-12 px-6">
        <label className="cursor-pointer w-full flex flex-col items-center">
          <input
            type="file"
            className="hidden"
            accept={acceptedTypes}
            onChange={handleFileInput}
            disabled={isLoading}
          />
          <div className={cn(
            "p-4 rounded-full mb-4 transition-colors",
            isDragOver ? "bg-primary/20" : "bg-muted"
          )}>
            <Upload className={cn(
              "h-10 w-10 transition-colors",
              isDragOver ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <p className="text-lg font-medium text-foreground mb-2">
            Arraste e solte o arquivo aqui
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            ou clique para selecionar
          </p>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
              Imagens
            </span>
            <span className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
              PDF
            </span>
          </div>
        </label>
      </CardContent>
    </Card>
  );
};

export default FileDropzone;
