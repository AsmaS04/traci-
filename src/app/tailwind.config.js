/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        accentdark: {
          "primary":         "#f59e0b",
          "primary-content": "#0b1320",
          "secondary":       "#818cf8",
          "accent":          "#34d399",
          "neutral":         "#1e2d3d",
          "base-100":        "#0b1320",
          "base-200":        "#111d2e",
          "base-300":        "#1e2d3d",
          "base-content":    "#e2e8f0",
          "info":            "#38bdf8",
          "success":         "#34d399",
          "warning":         "#f59e0b",
          "error":           "#f87171",
        },
      },
    ],
  },
}