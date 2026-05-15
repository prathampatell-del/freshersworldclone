import { ReactNode } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center" role="status">
      {icon && <div className="mb-3 inline-flex items-center justify-center text-gray-300">{icon}</div>}
      <h3 className="font-semibold text-gray-700 mb-1">{title}</h3>
      {message && <p className="text-sm text-gray-500 mb-4">{message}</p>}
      {action}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center" role="alert">
      <div className="flex items-center justify-center text-red-500 mb-2">
        <AlertCircle size={28} aria-hidden="true" />
      </div>
      <h3 className="font-semibold text-red-700 mb-1">{title}</h3>
      {message && <p className="text-sm text-red-600 mb-3">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 bg-white border border-red-300 text-red-700 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 transition"
        >
          Try again
        </button>
      )}
    </div>
  );
}

interface PageSpinnerProps {
  label?: string;
}

export function PageSpinner({ label = 'Loading' }: PageSpinnerProps) {
  return (
    <div
      className="flex items-center justify-center min-h-screen"
      role="status"
      aria-live="polite"
    >
      <Loader2 size={32} className="animate-spin text-orange-500" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
