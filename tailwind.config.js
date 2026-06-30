/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        forest: {
          50: "#E8F5E9",
          100: "#C8E6C9",
          200: "#A5D6A7",
          300: "#81C784",
          400: "#66BB6A",
          500: "#2D6A4F",
          600: "#1B4332",
          700: "#143D2B",
          800: "#0D2818",
          900: "#081C0F",
        },
        orange: {
          accent: "#F77F00",
          light: "#FCBF49",
          dark: "#E36414",
        },
        cream: "#FEFAE0",
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', "sans-serif"],
        mono: ['"Space Grotesk"', "monospace"],
      },
    },
  },
  plugins: [],
};
