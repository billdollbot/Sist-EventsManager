// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api":      { target: "http://localhost:5000", changeOrigin: true },
      "/uploads":  { target: "http://localhost:5000", changeOrigin: true },
    },
  },
});

/* ─── .env.example ──────────────────────────────────
   Copy this file to .env and fill in your values.
   ─────────────────────────────────────────────────── */

// VITE_API_URL=http://localhost:5000
// (Leave blank when using Vite's dev proxy above)


/* ─── tailwind.config.js ────────────────────────────
   Tailwind setup — all CSS vars live in App.css,
   Tailwind is used only for utility helpers.
   ─────────────────────────────────────────────────── */

// /** @type {import('tailwindcss').Config} */
// export default {
//   content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
//   theme: { extend: {} },
//   plugins: [],
// };
