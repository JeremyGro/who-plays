/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['Plus Jakarta Sans', 'sans-serif'],
        serif: ['Lora', 'serif'],
      },
      colors: {
        ink:    '#1a1917',
        paper:  '#f6f5f0',
        muted:  '#6b6860',
        faint:  '#a09d95',
        border: '#e4e1d8',
        surface: '#ffffff',
        green: {
          DEFAULT: '#2a6049',
          light:   '#40916c',
          bg:      '#edf5f0',
          border:  '#b5d9c8',
        },
        red: {
          DEFAULT: '#8b2a10',
          bg:      '#fdf0ec',
          border:  '#f4c0b0',
        },
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 1px 8px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
