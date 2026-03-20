import { useState } from 'react';
import { Toast } from './Toast';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

let toastCount = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    duration?: number
  ) => {
    const id = `toast-${++toastCount}`;
    const toast: ToastMessage = { id, message, type, duration };
    setToasts((prev) => [...prev, toast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const ToastContainer = () => (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={removeToast}
        />
      ))}
    </div>
  );

  return { addToast, removeToast, ToastContainer };
}
