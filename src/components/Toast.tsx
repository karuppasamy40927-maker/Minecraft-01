import React from 'react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type?: 'success' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none w-full max-w-sm px-4"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl bg-[#10131d]/95 border border-emerald-500/40 text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out"
        >
          {toast.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : toast.type === 'info' ? (
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
          )}

          <div className="flex flex-col text-xs">
            <span className="font-semibold text-zinc-100">{toast.title}</span>
            {toast.message && (
              <span className="text-[11px] text-zinc-400">{toast.message}</span>
            )}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-zinc-500 hover:text-white p-1 rounded transition-colors ml-2"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
