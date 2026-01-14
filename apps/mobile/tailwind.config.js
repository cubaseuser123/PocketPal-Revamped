/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#FF8C32",
        "primary-hover": "#e67e2d",
        secondary: "#FFA24C",
        "background-dark": "#0F0F14",
        "card-dark": "#1A1A22",
        "card-dark-secondary": "#2A2A35",
        "text-secondary": "#B0B0C3",
        success: "#3DDC97",
        danger: "#FF4B4B",
        gold: "#FFD166",
      },
      fontFamily: {
        display: ["Inter"],
      },
    },
  },
  plugins: [],
};
