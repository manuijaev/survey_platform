"use client";

import { AnimatePresence } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { toastService, type ToastRecord } from "@/lib/toast-service";
import { Toast } from "./Toast";

type ToastContextValue = typeof toastService;

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastViewport({ toasts, onDismiss }: { toasts: ToastRecord[]; onDismiss: (id: string) => void }) {
  // Must only render after mount — createPortal is browser-only and causes hydration mismatch if run on server
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-[calc(100vw-2rem)] max-w-[28rem] -translate-x-1/2 flex-col gap-3 sm:bottom-6 sm:left-auto sm:right-6 sm:w-auto sm:translate-x-0">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const handleDismiss = useCallback((id: string) => {
    toastService.dismiss(id);
  }, []);

  useEffect(() => {
    return toastService.subscribe(setToasts);
  }, []);

  return (
    <ToastContext.Provider value={toastService}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={handleDismiss} />
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  return context ?? toastService;
};
