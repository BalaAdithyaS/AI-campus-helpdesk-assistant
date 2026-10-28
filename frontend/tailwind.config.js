/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          bg: "#F8FAFC",
          card: "#FFFFFF",
          navy: "#0F172A",
          muted: "#475569",
          slate: "#E2E8F0",
          border: "#E2E8F0",
          blue: "#1E40AF",
          blueHover: "#1D4ED8",
          blueLight: "#EFF6FF",
          accent: "#2563EB",
          badge: "#F1F5F9"
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    },
  },
  plugins: [],
}
