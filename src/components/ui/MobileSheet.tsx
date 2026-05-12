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
 * Keyboard-safe bottom sheet for mobile forms.
 *
 * Strategy:
 * - On mobile the sheet is anchored to the bottom of the *visual* viewport
 *   (the area not covered by the on-screen keyboard) via visualViewport API.
 * - On desktop it centres like a normal modal.
 * - The body scroll is locked while open.
 * - The inner body is overflow-y-auto so content scrolls inside the sheet.
 */
export function MobileSheet({ open, onClose, title, badge, children, footer }: MobileSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Escape key closes
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // visualViewport: keep sheet above keyboard on iOS/Android
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const sheet = sheetRef.current;
      if (!sheet) return;
      // Distance from bottom of visual viewport to bottom of layout viewport
      const offsetFromBottom = window.innerHeight - (vv.offsetTop + vv.height);
      sheet.style.bottom = `${Math.max(offsetFromBottom, 0)}px`;
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      // Reset when closed
      if (sheetRef.current) sheetRef.current.style.bottom = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop — only background blurs, not the sheet */}
      <div
        className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet wrapper — flex column, anchored bottom on mobile, centred on desktop */}
      <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4">
        <div
          ref={sheetRef}
          className={cn(
            // Layout
            'relative flex w-full flex-col',
            // Mobile: full width, rounded top, max 85% of screen height
            'max-h-[85dvh] rounded-t-[2rem] sm:max-h-[90vh] sm:max-w-lg sm:rounded-[1.75rem]',
            // Visual style — NO backdrop-blur on the sheet itself so content stays sharp
            'border border-white/10 shadow-2xl shadow-black/60',
          )}
          style={{
            background: 'linear-gradient(145deg, rgba(15,15,20,0.98) 0%, rgba(10,12,20,0.99) 100%)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle (mobile only) */}
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

          {/* Scrollable body — this is the key: overflow-y-auto here, not on the outer wrapper */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 [&_input]:scroll-mt-6 [&_textarea]:scroll-mt-6">
            {children}
          </div>

          {/* Sticky footer — always visible above keyboard */}
          <div
            className="shrink-0 border-t border-white/[0.07] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3"
            style={{ background: 'rgba(10,12,20,0.98)' }}
          >
            {footer}
          </div>
        </div>
      </div>
    </>
  );
}
