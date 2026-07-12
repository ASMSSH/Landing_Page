import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface MvpContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const MvpContext = createContext<MvpContextValue | null>(null);

export function MvpProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  return <MvpContext.Provider value={{ isOpen, open, close }}>{children}</MvpContext.Provider>;
}

export function useMvp(): MvpContextValue {
  const ctx = useContext(MvpContext);
  if (!ctx) throw new Error('useMvp must be used within MvpProvider');
  return ctx;
}
