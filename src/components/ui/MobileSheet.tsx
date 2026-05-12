import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MobileSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  badge?: string;
  children: ReactNode;
  footer: ReactNode;
}

export function MobileSheet({ open, onClose, title, badge, children, footer }: MobileSheetProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Mobile keyboard: adjust scroll body padding so focused input stays visible.
  // We do NOT move the sheet — it stays fixed at bottom-0.
  // Instead we add padding-bottom to the scrollable body equal to the keyboard height,
  // then scrollIntoView the focused element.
  useEffect(() => {
    if (!open) return;
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      const body = bodyRef.current;
      if (!body) return;

      // Keyboard height = how much the visual viewport shrank from the layout viewport
      const keyboardHeight = Math.max(window.innerHeight - vv.height - vv.offsetTop, 0);

      // Add padding so content isn't hidden behind keyboard
      body.style.paddingBottom = keyboardHeight > 0 ? `${keyboardHeight + 80}px` : '';

      // Scroll focused element into view after a short delay (keyboard animation)
      if (keyboardHeight > 0) {
        setTimeout(() => {
          const focused = document.activeElement as HTMLElement | null;
          if (focused && body.contains(focused)) {
            focused.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }, 100);
      }
    };

    vv.addEventListener('resize', onResize);
    return () => {
      vv.removeEventListener('resize', onResize);
      if (bodyRef.current) bodyRef.current.style.paddingBottom = '';
    };
  }, [open]);

  // scrollIntoView on any input/textarea focus inside the sheet
  useEffect(() => {
    if (!open) return;
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      setTimeout(() => {
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 250);
    };

    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, [open]);

  if (!open) return null;

  return (
    // Full-screen backdrop — z-[200] covers nav (z-70), FAB (z-80), command (z-100)
    <div
      className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-md"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label={title}
    >
      {/*
       * MOBILE: fixed inset-x-0 bottom-0 — sheet is always anchored to the
       * bottom of the layout viewport. The keyboard slides up underneath it.
       * We never move the sheet; we only adjust internal scroll padding.
       *
       * DESKTOP (sm:): absolute-positioned inside the backdrop flex container,
       * centred like a normal dialog.
       */}
      <div className="pointer-events-none absolute inset-0 hidden sm:flex sm:items-center sm:justify-center sm:p-6">
        {/* desktop centering shell — pointer-events-none so backdrop click still works */}
      </div>

      {/* Mobile sheet — fixed to bottom of screen */}
      <div
        className={cn(
          'pointer-events-auto',
          // Mobile: fixed bottom sheet
          'fixed inset-x-0 bottom-0',
          'flex flex-col',
          'max-h-[85svh]',
          'rounded-t-[2rem]',
          // Desktop: centred dialog
          'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2',
          'sm:w-full sm:max-w-lg sm:max-h-[90vh]',
          'sm:rounded-[1.75rem]',
          // Shared
          'border border-white/10 shadow-2xl shadow-black/70',
        )}
        style={{
          background: 'linear-gradient(160deg, rgba(14,14,22,0.99) 0%, rgba(9,11,19,1) 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-white/15 sm:hidden" />

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div className="space-y-0.5">
            {badge && (
              <span className="inline-block rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-violet-400">
                {badge}
              </span>
            )}
            <h3 className="font-display text-lg font-bold text-white">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-400 transition-all hover:text-white active:scale-95"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body — padding-bottom adjusted by keyboard handler */}
        <div
          ref={bodyRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4"
          style={{ scrollPaddingBottom: '120px' }}
        >
          {children}
        </div>

        {/* Footer — always inside sheet, never detached */}
        <div
          className="shrink-0 border-t border-white/[0.07] px-5 pt-3"
          style={{
            paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
            background: 'rgba(9,11,19,1)',
          }}
        >
          {footer}
        </div>
      </div>
    </div>
  );
}
