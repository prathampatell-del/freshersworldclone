import { useRef, useState } from 'react';
import { Upload, FileText, X, ExternalLink, Loader2 } from 'lucide-react';
import { usersApi } from '../api';
import { useToast } from './ui/Toast';

interface ResumeUploadProps {
  resumeUrl?: string | null;
  onChange?: (url: string | null) => void;
  compact?: boolean;
}

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export function ResumeUpload({ resumeUrl, onChange, compact = false }: ResumeUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleFile = async (file: File) => {
    if (file.size > MAX_BYTES) {
      toast('Resume must be 5 MB or smaller', 'error');
      return;
    }
    setUploading(true);
    try {
      const res = await usersApi.uploadResume(file);
      onChange?.(res.data.resume_url);
      toast('Resume uploaded');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Failed to upload resume';
      toast(message, 'error');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await usersApi.deleteResume();
      onChange?.(null);
      toast('Resume removed', 'info');
    } catch {
      toast('Failed to remove resume', 'error');
    } finally {
      setRemoving(false);
    }
  };

  const filename = resumeUrl ? resumeUrl.split('/').pop() ?? 'Resume' : null;

  return (
    <div className={compact ? '' : 'bg-white border border-gray-200 rounded-xl p-4'}>
      {!compact && (
        <h3 className="font-semibold text-gray-700 text-sm mb-2 flex items-center gap-2">
          <FileText size={14} className="text-orange-500" aria-hidden="true" /> Resume
        </h3>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="sr-only"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        aria-label="Upload resume"
      />

      {resumeUrl ? (
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
          <FileText size={18} className="text-blue-500 shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{filename}</p>
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              View resume <ExternalLink size={11} aria-hidden="true" />
            </a>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading || removing}
              className="text-xs font-medium text-orange-600 hover:text-orange-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Replace'}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading || removing}
              aria-label="Remove resume"
              className="text-gray-400 hover:text-red-500 transition disabled:opacity-50"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition rounded-lg p-6 text-center disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 size={22} className="animate-spin text-orange-500" aria-hidden="true" />
          ) : (
            <Upload size={22} className="text-gray-400" aria-hidden="true" />
          )}
          <span className="text-sm font-medium text-gray-700">
            {uploading ? 'Uploading…' : 'Upload your resume'}
          </span>
          <span className="text-xs text-gray-400">PDF, DOC, or DOCX · max 5 MB</span>
        </button>
      )}
    </div>
  );
}
