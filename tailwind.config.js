/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./blog/**/*.html",
    "./industries/**/*.html",
    "./services/**/*.html",
    "./admin/**/*.html",
    "./assets/**/*.{js,css}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Josefin Sans"', "system-ui", "sans-serif"],
        sans: ['"Open Sans"', '"Josefin Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#121212",
        paper: "#f7f7f7",
        mist: "#EEE9DE",
        muted: "#7A7A7A",
        line: "rgba(17,17,17,0.10)",
        trust: "#00b67a",
      },
      boxShadow: {
        soft: "0 20px 50px -24px rgba(17,17,17,0.28)",
        lift: "0 12px 40px -18px rgba(17,17,17,0.18)",
        glow: "0 30px 80px -36px rgba(17,17,17,0.55)",
      },
    },
  },
  plugins: [],
};
