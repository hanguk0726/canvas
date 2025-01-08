/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#7F56D9',
                secondary: '#9E77ED',
                'gray-dark': '#0E1013',
                'gray-darker': '#17181B',
                'gray-light': '#282A2D',
                'gray-light-alt': '#5F6368',
                turquoise: '#3BC4CC'
            },
        },
    },
    plugins: [],
}