import React, { createContext, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ToastMessage {
  id: number;
  title: string;
  description?: string;
}

const ToastContext = createContext<
  (msg: Omit<ToastMessage, "id">) => void
>(() => {});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const push = (msg: Omit<ToastMessage, "id">) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, ...msg }]);
    setTimeout(() =>
      setToasts((t) => t.filter((toast) => toast.id !== id)), 3000);
  };

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-md bg-muted px-4 py-2 shadow"
            >
              <p className="text-sm font-medium">{t.title}</p>
              {t.description && (
                <p className="text-xs text-muted-foreground">{t.description}</p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
