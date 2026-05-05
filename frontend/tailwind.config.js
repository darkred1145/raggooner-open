/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                heading: ['Rajdhani', 'sans-serif'],
            },
            colors: {
                cyber: {
                    black: '#0a0a0f',
                    dark: '#0d0d1a',
                    panel: '#12122a',
                    border: '#1e1e42',
                    glow: '#00f0ff',
                    cyan: '#00f0ff',
                    magenta: '#ff00aa',
                    purple: '#a855f7',
                    neonPink: '#ff2d95',
                    electricBlue: '#0066ff',
                }
            },
        },
    },
    plugins: [],
}
