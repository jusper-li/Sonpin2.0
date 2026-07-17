import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

interface MultiImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  bucket: string;
  label?: string;
  maxImages?: number;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default function MultiImageUpload({ images, onImagesChange, bucket, label, maxImages = 10 }: MultiImageUploadProps) {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      alert(t('multi_image_upload.too_many', `最多只能上傳 ${maxImages} 張圖片`));
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (!file.type.startsWith('image/')) {
          throw new Error(t('multi_image_upload.invalid_file', '請選擇圖片檔案'));
        }

        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);
        if (uploadError) {
          console.warn(`Storage upload failed for bucket "${bucket}", using inline data URL fallback.`, uploadError);
          return await fileToDataUrl(file);
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return data.publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onImagesChange([...images, ...uploadedUrls]);

      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Upload failed:', error);
      alert(t('multi_image_upload.upload_failed', '圖片上傳失敗，請稍後再試'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const handleUrlAdd = () => {
    const url = prompt(t('multi_image_upload.prompt_url', '請輸入圖片 URL'));
    if (url && url.trim()) {
      if (images.length >= maxImages) {
        alert(t('multi_image_upload.too_many', `最多只能上傳 ${maxImages} 張圖片`));
        return;
      }
      onImagesChange([...images, url.trim()]);
    }
  };

  return (
    <div>
      {label && <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>}

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= maxImages}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {uploading ? t('multi_image_upload.uploading', '上傳中…') : t('multi_image_upload.upload', '上傳圖片')}
        </button>

        <button
          type="button"
          onClick={handleUrlAdd}
          disabled={images.length >= maxImages}
          className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('multi_image_upload.add_url', '新增 URL')}
        </button>

        <span className="ml-2 self-center text-sm text-slate-500">
          {images.length} / {maxImages}
        </span>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {images.map((url, index) => (
            <div key={index} className="group relative">
              <img
                src={url}
                alt={t('multi_image_upload.image_alt', '圖片') + ` ${index + 1}`}
                className="aspect-video w-full rounded-lg border border-slate-200 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3E%3F%3C/text%3E%3C/svg%3E';
                }}
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute right-2 top-2 rounded-lg bg-red-600 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-700 group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-2 left-2 rounded bg-blue-600 px-2 py-1 text-xs text-white">
                  {t('multi_image_upload.cover', '封面')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
