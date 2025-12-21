/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'antigravity-bg': '#1e1e1e', // Dark theme matching IDE
                'antigravity-card': '#252526',
                'antigravity-accent': '#007acc',
            }
        },
    },
    plugins: [],
}
