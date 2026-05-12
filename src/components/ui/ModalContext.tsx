import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ModalState = {
  isOpen: boolean;
  title?: string;
  type?: 'sheet' | 'modal';
};

type ModalContextType = {
  modals: Record<string, ModalState>;
  openModal: (id: string, options?: Partial<ModalState>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  isAnyModalOpen: boolean;
};

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<Record<string, ModalState>>({});

  const openModal = useCallback((id: string, options: Partial<ModalState> = {}) => {
    setModals(prev => ({
      ...prev,
      [id]: {
        isOpen: true,
        type: 'sheet',
        ...options,
      },
    }));
  }, []);

  const closeModal = useCallback((id: string) => {
    setModals(prev => ({
      ...prev,
      [id]: { isOpen: false },
    }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals(prev =>
      Object.fromEntries(
        Object.entries(prev).map(([id, state]) => [
          id,
          { ...state, isOpen: false },
        ])
      )
    );
  }, []);

  const isAnyModalOpen = Object.values(modals).some(m => m.isOpen);

  return (
    <ModalContext.Provider value={{ modals, openModal, closeModal, closeAllModals, isAnyModalOpen }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal(id: string) {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }

  const modal = context.modals[id] || { isOpen: false };

  return {
    isOpen: modal.isOpen,
    open: (options?: Partial<ModalState>) => context.openModal(id, options),
    close: () => context.closeModal(id),
    toggle: () => (modal.isOpen ? context.closeModal(id) : context.openModal(id)),
  };
}

export function useModalContext() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within ModalProvider');
  }
  return context;
}
