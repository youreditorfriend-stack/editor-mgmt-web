/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          green: '#0F7B6C',
          greenBg: '#EAF3EB',
        },
      },
    },
  },
  plugins: [],
}
