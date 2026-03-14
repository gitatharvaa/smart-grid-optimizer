/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'primary-dark': '#1C2E1C',
                'primary-deeper': '#162416',
                'bg-cream': '#E8E6DC',
                'bg-card': '#F5F3EC',
                'amber': '#C9A227',
                'amber-hover': '#B8911F',
                'dark-text': '#1A2E1A',
                'tag-bg': '#2D4A2D',
                'tag-text': '#7BAE7B',
                'border': '#D4D0C4',
                'stable': '#22C55E',
                'unstable': '#EF4444',
            },
            fontFamily: {
                mono: ['JetBrains Mono', 'monospace'],
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
