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

/**
 * Keyboard-safe, fully-isolated bottom sheet.
 *
 * Z-index strategy:
 *   - Single wrapper at z-[200] covers MobileNav (z-70), FAB (z-80),
 *     CommandCenter (z-100), and everything else in the app.
 *   - The wrapper IS the backdrop (bg-black/75 backdrop-blur-md).
 *   - Clicking the wrapper outside the sheet panel closes it.
 *   - The sheet panel itself uses stopPropagation so clicks inside don't close.
 *
 * Keyboard strategy (iOS / Android):
 *   - visualViewport API tracks the visible area when the keyboard opens.
 *   - sheet.style.bottom is set to the gap between the visual viewport bottom
 *     and the layout viewport bottom, so the sheet rises with the keyboard.
 *   - No transform-based centering that fights iOS keyboard resize events.
 *
 * Scroll strategy:
 *   - document.body overflow:hidden while open — page behind cannot scroll.
 *   - Only the inner .sheet-body div scrolls (overflow-y-auto overscroll-contain).
 *   - Footer is always pinned inside the sheet, never detached.
 */
export function MobileSheet({ open, onClose, title, badge, children, footer }: MobileSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // ── Lock body scroll ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // ── Escape key ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // ── visualViewport: rise with keyboard ───────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const sheet = sheetRef.current;
      if (!sheet) return;
      // Gap between bottom of visual viewport and bottom of layout viewport
      const gap = window.innerHeight - (vv.offsetTop + vv.height);
      sheet.style.bottom = `${Math.max(gap, 0)}px`;
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      if (sheetRef.current) sheetRef.current.style.bottom = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    /*
     * ONE element = backdrop + positioner.
     * z-[200] sits above every app layer (nav z-70, FAB z-80, command z-100).
     * bg-black/75 + backdrop-blur-md dims and blurs the entire app behind it.
     * Clicking this element (but not the sheet panel) calls onClose.
     * On mobile: items-end anchors the sheet to the bottom.
     * On desktop: items-center + justify-center centres it like a dialog.
     */
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/75 backdrop-blur-md sm:items-center sm:p-6"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label={title}
    >
      {/*
       * Sheet panel — stopPropagation so clicks inside don't bubble to backdrop.
       * position: relative so visualViewport bottom offset applies correctly.
       * flex flex-col so header / body / footer stack and body can flex-1.
       */}
      <div
        ref={sheetRef}
        className={cn(
          'relative flex w-full flex-col',
          // Mobile: full width, rounded top corners, max 85dvh
          'max-h-[85dvh] rounded-t-[2rem]',
          // Desktop: centred dialog, rounded all corners, max 90vh, max-width
          'sm:max-h-[90vh] sm:max-w-lg sm:rounded-[1.75rem]',
          // Border + shadow — NO backdrop-blur here so content stays sharp
          'border border-white/10 shadow-2xl shadow-black/70',
        )}
        style={{
          // Solid dark background — no blur on the panel itself
          background: 'linear-gradient(160deg, rgba(14,14,22,0.99) 0%, rgba(9,11,19,1) 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle pill — mobile only */}
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-white/15 sm:hidden" />

        {/* ── Header ── */}
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

        {/* ── Scrollable body ── */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 [&_input]:scroll-mt-6 [&_select]:scroll-mt-6 [&_textarea]:scroll-mt-6">
          {children}
        </div>

        {/* ── Sticky footer — always inside the panel, never detached ── */}
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
