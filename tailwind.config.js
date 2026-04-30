/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1f3b2d",
          50: "#f1f6f3",
          100: "#dbe8df",
          200: "#b6d1bf",
          500: "#447a5e",
          700: "#1f3b2d",
          900: "#0e1f17",
        },
      },
    },
  },
  plugins: [],
};
