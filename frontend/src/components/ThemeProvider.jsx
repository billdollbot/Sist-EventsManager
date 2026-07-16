/**
 * ThemeProvider.jsx — Global Theme Context
 * Manages accent color + mode (light/dark/system) with CSS variable injection
 */
import { createContext, useContext, useState, useEffect, useCallback } from "react";

/* ─── Accent Palette ─────────────────────────────── */
export const ACCENTS = [
    { id: "emerald", label: "Emerald", hex: "#10b981", hoverHex: "#059669", lightHex: "rgba(16,185,129,0.12)", darkHex: "#047857", fgHex: "#ffffff" },
    { id: "blue", label: "Blue", hex: "#3b82f6", hoverHex: "#2563eb", lightHex: "rgba(59,130,246,0.12)", darkHex: "#1d4ed8", fgHex: "#ffffff" },
    { id: "purple", label: "Purple", hex: "#8b5cf6", hoverHex: "#7c3aed", lightHex: "rgba(139,92,246,0.12)", darkHex: "#6d28d9", fgHex: "#ffffff" },
    { id: "indigo", label: "Indigo", hex: "#6366f1", hoverHex: "#4f46e5", lightHex: "rgba(99,102,241,0.12)", darkHex: "#4338ca", fgHex: "#ffffff" },
    { id: "orange", label: "Orange", hex: "#f59e0b", hoverHex: "#d97706", lightHex: "rgba(245,158,11,0.12)", darkHex: "#b45309", fgHex: "#000000" },
    { id: "red", label: "Red", hex: "#ef4444", hoverHex: "#dc2626", lightHex: "rgba(239,68,68,0.12)", darkHex: "#b91c1c", fgHex: "#ffffff" },
    { id: "pink", label: "Pink", hex: "#ec4899", hoverHex: "#db2777", lightHex: "rgba(236,72,153,0.12)", darkHex: "#be185d", fgHex: "#ffffff" },
    { id: "teal", label: "Teal", hex: "#14b8a6", hoverHex: "#0d9488", lightHex: "rgba(20,184,166,0.12)", darkHex: "#0f766e", fgHex: "#ffffff" },
];

/* ─── Mode palettes ──────────────────────────────── */
const DARK_TOKENS = {
    "--bg-page": "#03080f",
    "--bg-card": "#0a1628",
    "--bg-elevated": "#0f2040",
    "--bg-sidebar": "#06101c",
    "--sidebar-text": "#e2e8f0",
    "--text-primary": "#eef2ff",
    "--text-secondary": "#94a3b8",
    "--text-muted": "#4e6380",
    "--border-subtle": "rgba(255,255,255,0.06)",
    "--border-light": "rgba(255,255,255,0.10)",
    "--skeleton-from": "#0a1628",
    "--skeleton-via": "#0f2040",
    "--overlay-bg": "rgba(0,0,0,0.78)",
    "--scrollbar-bg": "#06101c",
    "--card-shadow": "0 20px 60px rgba(0,0,0,0.55)",
};

const LIGHT_TOKENS = {
    "--bg-page": "#f1f5f9",
    "--bg-card": "#ffffff",
    "--bg-elevated": "#e8edf5",
    "--bg-sidebar": "#1e293b",
    "--sidebar-text": "#e2e8f0",
    "--text-primary": "#0f172a",
    "--text-secondary": "#334155",
    "--text-muted": "#64748b",
    "--border-subtle": "rgba(0,0,0,0.08)",
    "--border-light": "rgba(0,0,0,0.13)",
    "--skeleton-from": "#e2e8f0",
    "--skeleton-via": "#f1f5f9",
    "--overlay-bg": "rgba(0,0,0,0.45)",
    "--scrollbar-bg": "#e2e8f0",
    "--card-shadow": "0 4px 24px rgba(0,0,0,0.10)",
};

/* ─── Apply theme to :root ───────────────────────── */
function applyTheme(accentId, resolved) {
    const a = ACCENTS.find(x => x.id === accentId) || ACCENTS[0];
    const tokens = resolved === "light" ? LIGHT_TOKENS : DARK_TOKENS;
    const root = document.documentElement;

    // Accent tokens
    root.style.setProperty("--accent", a.hex);
    root.style.setProperty("--accent-hover", a.hoverHex);
    root.style.setProperty("--accent-light", a.lightHex);
    root.style.setProperty("--accent-dark", a.darkHex);
    root.style.setProperty("--accent-fg", a.fgHex);
    root.style.setProperty("--accent-ring", a.hex + "40");
    root.style.setProperty("--accent-glow", a.lightHex);

    // Mode tokens
    Object.entries(tokens).forEach(([k, v]) => root.style.setProperty(k, v));

    // data attributes for CSS selectors
    root.dataset.theme = resolved;
    root.dataset.accent = accentId;
}

function resolveMode(mode) {
    if (mode === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return mode;
}

/* ─── Context ────────────────────────────────────── */
const ThemeContext = createContext(null);

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
}

export default function ThemeProvider({ children }) {
    const [accent, setAccentState] = useState(() => localStorage.getItem("sist_accent") || "emerald");
    const [mode, setModeState] = useState(() => localStorage.getItem("sist_mode") || "dark");

    const setAccent = useCallback((id) => {
        setAccentState(id);
        localStorage.setItem("sist_accent", id);
        applyTheme(id, resolveMode(mode));
    }, [mode]);

    const setMode = useCallback((m) => {
        setModeState(m);
        localStorage.setItem("sist_mode", m);
        applyTheme(accent, resolveMode(m));
    }, [accent]);

    const resetTheme = useCallback(() => {
        setAccent("emerald");
        setMode("dark");
    }, [setAccent, setMode]);

    // Apply on mount
    useEffect(() => {
        applyTheme(accent, resolveMode(mode));
    }, []);

    // Listen for system theme changes when in "system" mode
    useEffect(() => {
        if (mode !== "system") return;
        const mql = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => applyTheme(accent, resolveMode("system"));
        mql.addEventListener("change", handler);
        return () => mql.removeEventListener("change", handler);
    }, [mode, accent]);

    return (
        <ThemeContext.Provider value={{ accent, setAccent, mode, setMode, resetTheme, resolvedMode: resolveMode(mode) }}>
            {children}
        </ThemeContext.Provider>
    );
}
