import React, { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useModal } from './ModalContext';

type ModalProps = {
  id: string;
  children: ReactNode;
  title?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
};

export function Modal({
  id,
  children,
  title,
  onClose,
  showCloseButton = true,
  className,
}: ModalProps) {
  const { isOpen, close } = useModal(id);

  const handleClose = () => {
    close();
    onClose?.();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay - z-[90] */}
      <div
        className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Container - z-[100] */}
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center">
        {/* Mobile Sheet / Desktop Modal */}
        <div
          className={cn(
            'w-full sm:max-w-xl flex flex-col max-h-[100dvh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl',
            'border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03]',
            'backdrop-blur-xl shadow-2xl sm:shadow-2xl',
            'animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Sticky */}
          <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-white/5 bg-gradient-to-b from-white/[0.05] to-transparent px-5 py-4 sm:py-5">
            {title && (
              <h2 className="text-lg font-bold text-white">{title}</h2>
            )}
            {!title && <div />}
            {showCloseButton && (
              <button
                onClick={handleClose}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] text-white transition-all hover:bg-white/[0.08] active:scale-95"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Content - Scrollable */}
          <div className="min-w-0 flex-1 overflow-y-auto px-5 py-4 sm:py-5">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

type ModalFooterProps = {
  children: ReactNode;
  className?: string;
};

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-20 flex shrink-0 gap-3 border-t border-white/5',
        'bg-gradient-to-t from-white/[0.05] to-transparent px-5 py-4 sm:py-5',
        'backdrop-blur-lg',
        'safe-area-bottom',
        className
      )}
    >
      {children}
    </div>
  );
}

type ModalBodyProps = {
  children: ReactNode;
  className?: string;
};

export function ModalBody({ children, className }: ModalBodyProps) {
  return <div className={cn('space-y-4', className)}>{children}</div>;
}
