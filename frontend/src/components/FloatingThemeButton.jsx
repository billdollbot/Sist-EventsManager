/**
 * FloatingThemeButton.jsx — Omnipresent floating button
 * Opens ThemePanel on click (popup desktop, bottom sheet mobile)
 */
import { useState, useEffect, useCallback } from "react";
import { Palette } from "lucide-react";
import ThemePanel from "./ThemePanel";

export default function FloatingThemeButton() {
    const [open, setOpen] = useState(false);
    const [isMobile, setMobile] = useState(false);
    const [ripple, setRipple] = useState(false);

    // Detect mobile
    useEffect(() => {
        const check = () => setMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const toggle = useCallback(() => {
        if (!open) {
            setRipple(true);
            setTimeout(() => setRipple(false), 600);
        }
        setOpen(o => !o);
    }, [open]);

    return (
        <>
            {/* Floating button */}
            <button
                className="ftb-btn"
                onClick={toggle}
                aria-label="Customize theme"
                aria-expanded={open}
                title="Theme & Colors"
            >
                <Palette size={22} />
                {ripple && <span className="ftb-ripple" />}
            </button>

            {/* Panel */}
            {open && (
                <ThemePanel onClose={() => setOpen(false)} isMobile={isMobile} />
            )}

            {/* Styles */}
            <style>{`
        /* ── Floating Theme Button ─────────────────── */
        .ftb-btn {
          position: fixed;
          bottom: max(20px, env(safe-area-inset-bottom, 0px));
          right: 20px;
          z-index: 500;
          width: 52px; height: 52px;
          border-radius: 50%;
          border: 1px solid var(--border-light);
          background: var(--bg-card);
          color: var(--accent);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px var(--border-subtle);
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s, background 0.25s;
          overflow: hidden;
          -webkit-tap-highlight-color: transparent;
        }
        .ftb-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 40px rgba(0,0,0,0.35), 0 0 20px var(--accent-light);
        }
        .ftb-btn:active { transform: scale(0.92); }
        @media(max-width: 767px) {
          .ftb-btn { width: 48px; height: 48px; bottom: max(20px, calc(12px + env(safe-area-inset-bottom, 0px))); right: 16px; }
        }
        .ftb-ripple {
          position: absolute; inset: -4px;
          border: 2px solid var(--accent);
          border-radius: 50%;
          animation: ftb-ripple-anim 0.6s ease-out forwards;
          pointer-events: none;
        }
        @keyframes ftb-ripple-anim {
          0%   { transform: scale(0.8); opacity: 0.7; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        /* ── Theme Panel — Common ──────────────────── */
        .tp-content { padding: 18px 20px 20px; }
        .tp-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 18px;
        }
        .tp-title {
          font-family: var(--ff-display); font-size: 1rem;
          font-weight: 800; color: var(--text-primary);
        }
        .tp-icon-btn {
          width: 32px; height: 32px; border-radius: 8px;
          border: 1px solid var(--border-subtle);
          background: transparent; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-secondary);
          transition: all 0.15s ease;
        }
        .tp-icon-btn:hover { background: var(--accent-light); color: var(--accent); border-color: var(--accent-ring); }
        .tp-close-btn { display: none; }
        @media(max-width: 767px) { .tp-close-btn { display: flex; } }

        .tp-section { margin-bottom: 16px; }
        .tp-section:last-child { margin-bottom: 0; }
        .tp-section-label {
          font-size: 0.68rem; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--text-muted); margin-bottom: 10px;
        }

        /* Color grid */
        .tp-color-grid {
          display: flex; gap: 10px; flex-wrap: wrap;
        }
        @media(max-width: 767px) { .tp-color-grid { gap: 14px; } }
        .tp-color-btn {
          position: relative; width: 32px; height: 32px;
          border-radius: 50%; border: none; cursor: pointer;
          padding: 0; background: transparent;
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), outline 0.2s;
          display: flex; align-items: center; justify-content: center;
          -webkit-tap-highlight-color: transparent;
        }
        .tp-color-btn:hover { transform: scale(1.18); }
        .tp-color-btn:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
        @media(max-width: 767px) { .tp-color-btn { width: 38px; height: 38px; } }
        .tp-color-fill {
          width: 100%; height: 100%; border-radius: 50%;
          display: block;
        }
        .tp-check {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          animation: tp-check-in 0.2s ease both;
          pointer-events: none;
        }
        @keyframes tp-check-in { from { transform: translate(-50%,-50%) scale(0); } to { transform: translate(-50%,-50%) scale(1); } }
        .tp-ripple {
          position: absolute; inset: -6px;
          border: 2px solid var(--circle-color, var(--accent));
          border-radius: 50%;
          animation: tp-ripple-out 0.5s ease-out forwards;
          pointer-events: none;
        }
        @keyframes tp-ripple-out { 0% { transform: scale(0.7); opacity: 0.8; } 100% { transform: scale(1.8); opacity: 0; } }

        /* Mode buttons */
        .tp-mode-row { display: flex; gap: 6px; }
        .tp-mode-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 8px 0; border-radius: 10px;
          font-size: 0.78rem; font-weight: 600;
          border: 1px solid var(--border-subtle);
          background: transparent; color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.18s ease;
          min-height: 40px;
        }
        .tp-mode-btn:hover { border-color: var(--accent-ring); color: var(--text-primary); }
        .tp-mode-active {
          background: var(--accent-light) !important;
          border-color: var(--accent-ring) !important;
          color: var(--accent) !important;
          font-weight: 700;
        }
        @media(max-width: 767px) { .tp-mode-btn { min-height: 48px; font-size: 0.84rem; } }

        /* ── Desktop Popup ─────────────────────────── */
        .tp-popup {
          position: fixed;
          bottom: max(80px, calc(env(safe-area-inset-bottom, 0px) + 80px));
          right: 20px;
          z-index: 501;
          width: 280px;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: 16px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px var(--border-subtle);
          backdrop-filter: blur(24px) saturate(1.4);
          -webkit-backdrop-filter: blur(24px) saturate(1.4);
          animation: tp-popup-in 0.22s cubic-bezier(0.34,1.4,0.64,1) both;
        }
        @keyframes tp-popup-in {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @media(max-width: 767px) { .tp-popup { display: none; } }

        /* ── Mobile Bottom Sheet ───────────────────── */
        .tp-sheet-backdrop {
          position: fixed; inset: 0; z-index: 510;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(4px);
          animation: fade-in 0.2s ease;
          display: none;
        }
        @media(max-width: 767px) { .tp-sheet-backdrop { display: block; } }
        .tp-sheet {
          position: fixed; bottom: 0; left: 0; right: 0;
          z-index: 511;
          background: var(--bg-card);
          border-top: 1px solid var(--border-light);
          border-radius: 20px 20px 0 0;
          max-height: 75dvh; overflow-y: auto;
          padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
          animation: slide-up 0.3s cubic-bezier(0.34,1.2,0.64,1);
          touch-action: none;
        }
        .tp-drag-handle {
          width: 36px; height: 4px;
          border-radius: 99px; background: var(--border-light);
          margin: 10px auto 4px;
        }

        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
        </>
    );
}
