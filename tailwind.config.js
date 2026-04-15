/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./app/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#2C362F",
                secondary: "#57625a",
                accent: "#745b3b",
                background: "#f9f9f9",
                surface: "#ffffff",
                "on-surface": "#2d3435",
                "on-background": "#2d3435",
                "on-primary": "#faf7f6",
                "surface-container": "#ebeeef",
                "surface-container-low": "#f2f4f4",
                "surface-container-high": "#e4e9ea",
                "outline-variant": "#adb3b4",
            },
            fontFamily: {
                headline: ["Noto Serif", "serif"],
                body: ["Inter", "sans-serif"],
            },
            spacing: {
                '18': '4.5rem',
                '22': '5.5rem',
            }
        },
    },
    plugins: [],
}
