/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "nf-primary": "#B9794B",
        "nf-primary-soft": "#F3E2D4",
        "nf-bg": "#F7F3ED",
        "nf-surface": "#FFFFFF",
        "nf-border": "#E2D7C8",
        "nf-text": "#222222",
        "nf-text-muted": "#6F6A63",
        "nf-ink": "#2E2A26",
        "nf-secondary": "#1E4941",
        "nf-success": "#3E7F4C",
        "nf-warning": "#C58B3A",
        "nf-error": "#B4493D",
        "nf-grey-100": "#F4F4F4",
        "nf-grey-300": "#D6D3CF",
        "nf-grey-700": "#4A4742",
      },
      fontFamily: {
        sans: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
        heading: ["var(--font-fraunces)", ...defaultTheme.fontFamily.serif],
      },
    },
  },
  plugins: [],
};
