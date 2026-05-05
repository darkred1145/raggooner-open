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
                heading: ['Orbitron', 'sans-serif'],
            },
            colors: {
                cyber: {
                    black: '#0a0a0f',
                    dark: '#0d0d1a',
                    panel: '#12122a',
                    border: '#1a1a3e',
                    glow: '#00f0ff',
                    cyan: '#00f0ff',
                    magenta: '#ff00aa',
                    purple: '#a855f7',
                    neonPink: '#ff2d95',
                    electricBlue: '#0066ff',
                }
            },
            boxShadow: {
                'neon-cyan': '0 0 5px #00f0ff, 0 0 10px #00f0ff40, 0 0 20px #00f0ff20',
                'neon-magenta': '0 0 5px #ff00aa, 0 0 10px #ff00aa40, 0 0 20px #ff00aa20',
                'neon-purple': '0 0 5px #a855f7, 0 0 10px #a855f740, 0 0 20px #a855f720',
                'neon-cyan-lg': '0 0 10px #00f0ff, 0 0 20px #00f0ff40, 0 0 40px #00f0ff20',
                'neon-magenta-lg': '0 0 10px #ff00aa, 0 0 20px #ff00aa40, 0 0 40px #ff00aa20',
            },
            animation: {
                'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
                'glow-sweep': 'glowSweep 3s ease-in-out infinite',
            },
            keyframes: {
                pulseNeon: {
                    '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
                    '50%': { opacity: '0.8', filter: 'brightness(1.3)' },
                },
                glowSweep: {
                    '0%, 100%': { boxShadow: '0 0 5px #00f0ff30, 0 0 10px #00f0ff10' },
                    '50%': { boxShadow: '0 0 15px #00f0ff50, 0 0 30px #00f0ff30, 0 0 45px #00f0ff10' },
                },
            },
        },
    },
    plugins: [],
}
