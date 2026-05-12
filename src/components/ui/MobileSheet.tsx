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

  // Lock body scroll while open - lock both body and documentElement
  useEffect(() => {
    if (!open) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevDocOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevDocOverflow;
    };
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Mobile keyboard: adjust scroll body padding so focused input stays visible.
  // Using visualViewport to handle keyboard appearing/disappearing
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
      // Use padding-bottom to ensure content can scroll above keyboard
      body.style.paddingBottom = keyboardHeight > 0 ? `${keyboardHeight + 100}px` : '';

      // Scroll focused element into view after a short delay (keyboard animation)
      if (keyboardHeight > 0) {
        setTimeout(() => {
          const focused = document.activeElement as HTMLElement | null;
          if (focused && body.contains(focused)) {
            focused.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }, 150);
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
      // Delay to allow keyboard to appear
      setTimeout(() => {
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 200);
    };

    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, [open]);

  if (!open) return null;

  return (
    // Full-screen modal container - z-[9999] to be above everything including bottom nav
    // Uses 100dvh for proper keyboard handling on iOS Safari
    <div
      className="fixed inset-0 z-[9999] h-[100dvh] overflow-hidden bg-[#07070c]"
      aria-modal="true"
      role="dialog"
      aria-label={title}
    >
      <div className="flex h-full flex-col">
        {/* Header - sticky at top */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.07] bg-[#07070c]/95 px-5 py-4 backdrop-blur-xl">
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
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-400 transition-all hover:text-white active:scale-95"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body - flex-1 with overflow-y-auto for proper scrolling */}
        <div
          ref={bodyRef}
          className="flex-1 overflow-y-auto overscroll-contain px-5 py-5"
          style={{ scrollPaddingBottom: '200px' }}
        >
          {children}
        </div>

        {/* Footer - sticky at bottom with safe area padding */}
        <div className="sticky bottom-0 z-30 border-t border-white/[0.07] bg-[#07070c]/95 px-5 pt-4 backdrop-blur-xl"
          style={{
            paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
          }}
        >
          {footer}
        </div>
      </div>
    </div>
  );
}