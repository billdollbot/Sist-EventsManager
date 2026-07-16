/**
 * ThemePanel.jsx — Accent color + mode selector
 * Desktop: floating glassmorphism card
 * Mobile: swipeable bottom sheet
 */
import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Monitor, Check, RotateCcw, X } from "lucide-react";
import { useTheme, ACCENTS } from "./ThemeProvider";

const MODES = [
    { id: "light", icon: Sun, label: "Light" },
    { id: "dark", icon: Moon, label: "Dark" },
    { id: "system", icon: Monitor, label: "System" },
];

/* ─── Color Circle ───────────────────────────────── */
function ColorCircle({ accent: a, selected, onClick }) {
    const [ripple, setRipple] = useState(false);

    const handleClick = () => {
        setRipple(true);
        setTimeout(() => setRipple(false), 500);
        onClick(a.id);
    };

    return (
        <button
            onClick={handleClick}
            title={a.label}
            aria-label={`Select ${a.label} accent color`}
            aria-pressed={selected}
            className="tp-color-btn"
            style={{
                "--circle-color": a.hex,
                outline: selected ? `3px solid ${a.hex}` : "3px solid transparent",
                outlineOffset: 3,
                transform: selected ? "scale(1.15)" : "scale(1)",
            }}
        >
            <span
                className="tp-color-fill"
                style={{ background: a.hex }}
            />
            {selected && (
                <Check size={14} color={a.fgHex} strokeWidth={3} className="tp-check" />
            )}
            {ripple && <span className="tp-ripple" style={{ borderColor: a.hex }} />}
        </button>
    );
}

/* ─── Panel Content ──────────────────────────────── */
function PanelContent({ onClose }) {
    const { accent, setAccent, mode, setMode, resetTheme } = useTheme();

    return (
        <div className="tp-content">
            {/* Header */}
            <div className="tp-header">
                <p className="tp-title">Appearance</p>
                <div style={{ display: "flex", gap: 4 }}>
                    <button className="tp-icon-btn" onClick={resetTheme} title="Reset to default" aria-label="Reset theme">
                        <RotateCcw size={14} />
                    </button>
                    <button className="tp-icon-btn tp-close-btn" onClick={onClose} title="Close" aria-label="Close theme panel">
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Accent colors — always first / at the top */}
            <div className="tp-section">
                <p className="tp-section-label">Color Palette</p>
                <div className="tp-color-grid">
                    {ACCENTS.map(a => (
                        <ColorCircle
                            key={a.id}
                            accent={a}
                            selected={accent === a.id}
                            onClick={setAccent}
                        />
                    ))}
                </div>
            </div>

            {/* Mode — below palette */}
            <div className="tp-section">
                <p className="tp-section-label">Mode</p>
                <div className="tp-mode-row">
                    {MODES.map(({ id, icon: Icon, label }) => (
                        <button
                            key={id}
                            className={`tp-mode-btn${mode === id ? " tp-mode-active" : ""}`}
                            onClick={() => setMode(id)}
                            aria-label={`${label} mode`}
                            aria-pressed={mode === id}
                        >
                            <Icon size={14} />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ─── Bottom Sheet (mobile) ──────────────────────── */
function BottomSheet({ onClose }) {
    const sheetRef = useRef(null);
    const startY = useRef(0);
    const currentY = useRef(0);

    const handleTouchStart = (e) => {
        startY.current = e.touches[0].clientY;
    };
    const handleTouchMove = (e) => {
        const delta = e.touches[0].clientY - startY.current;
        if (delta > 0 && sheetRef.current) {
            currentY.current = delta;
            sheetRef.current.style.transform = `translateY(${delta}px)`;
        }
    };
    const handleTouchEnd = () => {
        if (currentY.current > 100) {
            onClose();
        } else if (sheetRef.current) {
            sheetRef.current.style.transform = "translateY(0)";
            sheetRef.current.style.transition = "transform 0.25s ease";
            setTimeout(() => {
                if (sheetRef.current) sheetRef.current.style.transition = "";
            }, 250);
        }
        currentY.current = 0;
    };

    // Prevent body scroll when sheet is open
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    return (
        <div className="tp-sheet-backdrop" onClick={onClose}>
            <div
                ref={sheetRef}
                className="tp-sheet"
                onClick={e => e.stopPropagation()}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="tp-drag-handle" />
                <PanelContent onClose={onClose} />
            </div>
        </div>
    );
}

/* ─── Popup (desktop) ────────────────────────────── */
function Popup({ onClose }) {
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        // Delay to avoid immediate close from the button click
        const t = setTimeout(() => document.addEventListener("mousedown", handler), 10);
        return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
    }, [onClose]);

    return (
        <div ref={ref} className="tp-popup">
            <PanelContent onClose={onClose} />
        </div>
    );
}

/* ─── Exported Panel ─────────────────────────────── */
export default function ThemePanel({ onClose, isMobile }) {
    return isMobile ? <BottomSheet onClose={onClose} /> : <Popup onClose={onClose} />;
}
