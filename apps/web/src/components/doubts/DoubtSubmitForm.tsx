'use client';

import { useState, useRef } from 'react';
import { useCreateDoubtMutation } from '@/store/doubtsApi';
import { ImagePlus, Loader2 } from 'lucide-react';

interface DoubtSubmitFormProps {
  videoId?: string;
  chapterId?: string;
  onSuccess?: () => void;
}

export function DoubtSubmitForm({ videoId, chapterId, onSuccess }: DoubtSubmitFormProps) {
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [createDoubt, { isLoading }] = useCreateDoubtMutation();

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '');
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      const data = await res.json();
      setImageUrl(data.secure_url as string);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    await createDoubt({ text: text.trim(), imageUrl, videoId, chapterId });
    setText('');
    setImageUrl(undefined);
    onSuccess?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-[#1a56db]/30 bg-blue-50 p-4 space-y-3"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Describe your doubt clearly..."
        rows={3}
        className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1a56db] focus:outline-none"
        required
      />

      {imageUrl && (
        <div className="relative inline-block">
          <img src={imageUrl} alt="preview" className="max-h-32 rounded-lg object-contain" />
          <button
            type="button"
            onClick={() => setImageUrl(undefined)}
            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-0.5 text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
          {uploading ? 'Uploading…' : 'Add Image'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
          }}
        />

        <button
          type="submit"
          disabled={isLoading || !text.trim()}
          className="rounded-lg bg-[#1a56db] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1648c0] transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Posting…' : 'Post Doubt'}
        </button>
      </div>
    </form>
  );
}
