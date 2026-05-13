import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
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
  const sheetRef = useRef<HTMLDivElement>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [layoutHeight, setLayoutHeight] = useState(0);

  const updateKeyboardInset = useCallback(() => {
    if (typeof window === 'undefined') return;

    const visualViewport = window.visualViewport;
    const visualBottom = visualViewport
      ? visualViewport.height + visualViewport.offsetTop
      : window.innerHeight;
    const nextInset = Math.max(0, Math.round(window.innerHeight - visualBottom));
    setLayoutHeight(Math.round(window.innerHeight));

    // Ignore tiny browser chrome shifts so the action bar does not tremble.
    setKeyboardInset((current) => {
      const normalizedInset = nextInset > 48 ? nextInset : 0;
      return Math.abs(current - normalizedInset) > 1 ? normalizedInset : current;
    });
  }, []);

  const keepFocusedControlVisible = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const body = bodyRef.current;
    const sheet = sheetRef.current;
    const focused = document.activeElement as HTMLElement | null;

    if (!body || !sheet || !focused || !body.contains(focused)) return;
    if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(focused.tagName)) return;

    const focusedRect = focused.getBoundingClientRect();
    const sheetRect = sheet.getBoundingClientRect();
    const safeTop = sheetRect.top + 88;
    const safeBottom = sheetRect.bottom - 116;

    if (focusedRect.bottom > safeBottom) {
      body.scrollBy({ top: focusedRect.bottom - safeBottom, behavior });
    } else if (focusedRect.top < safeTop) {
      body.scrollBy({ top: focusedRect.top - safeTop, behavior });
    }
  }, []);

  // Lock body scroll while open - lock both body and documentElement
  useEffect(() => {
    if (!open) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevDocOverflow = document.documentElement.style.overflow;
    const prevBodyOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevDocOverflow;
      document.body.style.overscrollBehavior = prevBodyOverscroll;
    };
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Mobile keyboard: lift the bottom sheet above the virtual keyboard.
  useEffect(() => {
    if (!open) return;
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
      setKeyboardInset(0);
      return;
    }

    const visualViewport = window.visualViewport;
    let frame = 0;

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        updateKeyboardInset();
        window.setTimeout(() => keepFocusedControlVisible('smooth'), 90);
      });
    };

    scheduleUpdate();
    visualViewport?.addEventListener('resize', scheduleUpdate);
    visualViewport?.addEventListener('scroll', scheduleUpdate);
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('orientationchange', scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      visualViewport?.removeEventListener('resize', scheduleUpdate);
      visualViewport?.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('orientationchange', scheduleUpdate);
      setKeyboardInset(0);
    };
  }, [keepFocusedControlVisible, open, updateKeyboardInset]);

  // Keep newly focused inputs above the floating action bar.
  useEffect(() => {
    if (!open) return;
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      window.setTimeout(() => keepFocusedControlVisible('smooth'), 120);
      window.setTimeout(() => keepFocusedControlVisible('smooth'), 320);
    };

    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, [keepFocusedControlVisible, open]);

  if (!open) return null;

  return (
    <>
      {/* MOBILE: Fixed bottom sheet with keyboard-aware floating actions */}
      <div
        className={cn(
          'fixed inset-0 z-[9999] overflow-hidden',
          'bg-black/60 backdrop-blur-md',
          'md:hidden'
        )}
        aria-modal="true"
        role="dialog"
        aria-label={title}
      >
        <button
          type="button"
          aria-label="Close sheet"
          className="absolute inset-0 h-full w-full cursor-default"
          onClick={onClose}
        />

        <motion.div
          ref={sheetRef}
          initial={{ y: 28, opacity: 0.96 }}
          animate={{ y: -keyboardInset, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 390,
            damping: 36,
            mass: 0.9,
          }}
          className={cn(
            'absolute inset-x-0 bottom-0',
            'mx-auto flex max-h-[90dvh] w-full flex-col overflow-hidden',
            'rounded-t-[2rem] border border-white/10 border-b-0',
            'bg-[#07070c]/96 shadow-[0_-28px_100px_rgba(0,0,0,0.58),0_0_42px_rgba(59,130,246,0.12)]',
            'backdrop-blur-2xl'
          )}
          style={{
            maxHeight: keyboardInset > 0
              ? `min(90dvh, ${Math.max(1, layoutHeight - keyboardInset - 12)}px)`
              : '90dvh',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/40 to-transparent" />
          <div className="pointer-events-none absolute -right-16 bottom-6 h-40 w-40 rounded-full bg-blue-500/14 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-10 h-44 w-44 rounded-full bg-violet-500/14 blur-3xl" />

          {/* Header */}
          <div className="relative z-20 flex shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#07070c]/88 px-5 py-4 backdrop-blur-xl">
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

          {/* Scrollable body */}
          <div
            ref={bodyRef}
            className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-5 py-5"
            style={{
              scrollPaddingBottom: '8.5rem',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {children}
          </div>

          {/* Floating action bar */}
          <div className="relative z-30 shrink-0 px-4 pb-4 pt-2">
            <div className="rounded-full border border-white/12 bg-white/[0.075] p-2 shadow-[0_18px_60px_rgba(0,0,0,0.42),0_0_34px_rgba(139,92,246,0.24),0_0_44px_rgba(59,130,246,0.14)] backdrop-blur-2xl">
              {footer}
            </div>
          </div>
        </motion.div>
      </div>

      {/* DESKTOP/TABLET: Centered modal card with backdrop */}
      <div
        className={cn(
          'hidden md:flex',
          'fixed inset-0 z-[9999]',
          'items-center justify-center',
          'bg-black/60 backdrop-blur-md',
          'p-6'
        )}
        onClick={onClose}
        aria-modal="true"
        role="dialog"
        aria-label={title}
      >
        <div
          className={cn(
            'w-full max-w-3xl',
            'rounded-[32px]',
            'border border-white/10',
            'bg-[#0b1020]',
            'shadow-2xl',
            'overflow-hidden'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.07] px-8 py-5">
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

          {/* Content - natural height, no stretching */}
          <div className="max-h-[60vh] overflow-y-auto px-8 py-6">
            {children}
          </div>

          {/* Footer - natural positioning below content */}
          <div className="flex items-center justify-end gap-3 border-t border-white/[0.07] px-8 py-5">
            {footer}
          </div>
        </div>
      </div>
    </>
  );
}
