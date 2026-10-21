import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success' }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-150">
      <div
        className={`flex items-center gap-2.5 px-5 py-3 rounded-full font-black text-sm shadow-2xl border ${
          type === 'success'
            ? 'bg-[#4be39a] text-[#06331f] border-[#22995e]'
            : 'bg-red-500 text-white border-red-600'
        }`}
      >
        {type === 'success' ? (
          <CheckCircle2 className="w-5 h-5 shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 shrink-0" />
        )}
        <span className="truncate max-w-sm sm:max-w-md">{message}</span>
      </div>
    </div>
  );
};
