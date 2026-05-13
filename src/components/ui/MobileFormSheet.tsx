import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface MobileFormSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  badge?: string;
  children: ReactNode;
  formId: string;
  submitLabel: string;
  submittingLabel?: string;
  submitting?: boolean;
  submitDisabled?: boolean;
  cancelLabel?: string;
  className?: string;
}

export function MobileFormSheet({
  open,
  onClose,
  title,
  badge,
  children,
  formId,
  submitLabel,
  submittingLabel = 'Saving...',
  submitting = false,
  submitDisabled = false,
  cancelLabel = 'Cancel',
  className,
}: MobileFormSheetProps) {
  const titleId = useId();
  const bodyRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [layoutHeight, setLayoutHeight] = useState(0);

  const updateKeyboardInset = useCallback(() => {
    if (typeof window === 'undefined') return;

    const viewport = window.visualViewport;
    const visualBottom = viewport ? viewport.height + viewport.offsetTop : window.innerHeight;
    const nextInset = Math.max(0, Math.round(window.innerHeight - visualBottom));
    const normalizedInset = nextInset > 48 ? nextInset : 0;

    setLayoutHeight(Math.round(window.innerHeight));
    setKeyboardInset((current) => (Math.abs(current - normalizedInset) > 1 ? normalizedInset : current));
  }, []);

  const keepFocusedControlVisible = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const body = bodyRef.current;
    const sheet = sheetRef.current;
    const focused = document.activeElement as HTMLElement | null;

    if (!body || !sheet || !focused || !body.contains(focused)) return;
    if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(focused.tagName)) return;

    const focusedRect = focused.getBoundingClientRect();
    const sheetRect = sheet.getBoundingClientRect();
    const safeTop = sheetRect.top + 92;
    const safeBottom = sheetRect.bottom - 128;

    if (focusedRect.bottom > safeBottom) {
      body.scrollBy({ top: focusedRect.bottom - safeBottom, behavior });
    } else if (focusedRect.top < safeTop) {
      body.scrollBy({ top: focusedRect.top - safeTop, behavior });
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousDocOverflow = document.documentElement.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;

    const viewport = window.visualViewport;
    let frame = 0;

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        updateKeyboardInset();
        window.setTimeout(() => keepFocusedControlVisible('smooth'), 80);
      });
    };

    scheduleUpdate();
    viewport?.addEventListener('resize', scheduleUpdate);
    viewport?.addEventListener('scroll', scheduleUpdate);
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('orientationchange', scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', scheduleUpdate);
      viewport?.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('orientationchange', scheduleUpdate);
      setKeyboardInset(0);
    };
  }, [keepFocusedControlVisible, open, updateKeyboardInset]);

  useEffect(() => {
    if (!open) return;

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      window.setTimeout(() => keepFocusedControlVisible('smooth'), 120);
      window.setTimeout(() => keepFocusedControlVisible('smooth'), 320);
    };

    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, [keepFocusedControlVisible, open]);

  if (!open) return null;

  const sheetMaxHeight = keyboardInset > 0 && layoutHeight > 0
    ? `min(90dvh, ${Math.max(320, layoutHeight - keyboardInset - 12)}px)`
    : '90dvh';

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden bg-black/65 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label={`Close ${title}`}
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />

      <motion.div
        ref={sheetRef}
        initial={{ y: 42, opacity: 0.95 }}
        animate={{ y: -keyboardInset, opacity: 1 }}
        exit={{ y: 42, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 34, mass: 0.9 }}
        className={cn(
          'absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-3xl flex-col overflow-hidden',
          'rounded-t-[2rem] border border-white/10 border-b-0',
          'bg-[#070912]/95 shadow-[0_-28px_100px_rgba(0,0,0,0.62),0_0_54px_rgba(139,92,246,0.18),0_0_58px_rgba(59,130,246,0.12)]',
          'backdrop-blur-2xl will-change-transform',
          className
        )}
        style={{
          maxHeight: sheetMaxHeight,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/50 to-transparent" />
        <div className="pointer-events-none absolute -right-16 bottom-8 h-44 w-44 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-10 h-48 w-48 rounded-full bg-violet-500/15 blur-3xl" />

        <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#070912]/88 px-5 py-4 backdrop-blur-xl sm:px-7">
          <div className="min-w-0 space-y-1">
            {badge && (
              <span className="inline-flex rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-violet-300">
                {badge}
              </span>
            )}
            <h2 id={titleId} className="truncate font-display text-xl font-bold text-white">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.055] text-zinc-400 shadow-lg shadow-black/20 transition-all hover:border-white/20 hover:text-white active:scale-95"
            aria-label="Close"
            disabled={submitting}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div
          ref={bodyRef}
          className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7"
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollPaddingTop: '6rem',
            scrollPaddingBottom: '9rem',
          }}
        >
          {children}
        </div>

        <div className="relative z-30 shrink-0 px-4 pb-4 pt-2 sm:px-6">
          <div className="rounded-full border border-white/12 bg-white/[0.08] p-2 shadow-[0_20px_70px_rgba(0,0,0,0.48),0_0_36px_rgba(139,92,246,0.26),0_0_44px_rgba(59,130,246,0.16)] backdrop-blur-2xl">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="h-12 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-zinc-300 transition-all hover:bg-white/[0.07] hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                type="submit"
                form={formId}
                disabled={submitting || submitDisabled}
                className="h-12 flex-1 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 px-4 text-sm font-bold text-white shadow-[0_0_28px_rgba(139,92,246,0.42),0_14px_34px_rgba(59,130,246,0.18)] transition-all hover:shadow-[0_0_38px_rgba(139,92,246,0.5),0_16px_40px_rgba(59,130,246,0.24)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? submittingLabel : submitLabel}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
