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
            },
            animation: {
                'loading-arc': 'loading-arc 2s ease-in-out infinite',
                'loading-bar': 'loading-bar 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'fade-in-out': 'fade-in-out 2s ease-in-out infinite',
            },
            keyframes: {
                'loading-arc': {
                    '0%': { strokeDashoffset: '400' },
                    '50%': { strokeDashoffset: '0' },
                    '100%': { strokeDashoffset: '-400' },
                },
                'loading-bar': {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(300%)' },
                },
                'fade-in-out': {
                    '0%, 100%': { opacity: '0.4' },
                    '50%': { opacity: '1' },
                }
            }
        },
    },
    plugins: [],
}
