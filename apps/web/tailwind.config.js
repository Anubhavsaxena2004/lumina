/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FDF2F4',
          100: '#FCE7EB',
          200: '#F9D0D8',
          300: '#F4A9B8',
          400: '#EB728B',
          500: '#DF4164',
          600: '#C8254A',
          700: '#9B1C31', // Primary Kumkum Red
          800: '#84192B',
          900: '#6E1926',
          950: '#3D0911',
          DEFAULT: '#9B1C31',
        },
        gold: {
          50: '#FAF6EF',
          100: '#F5EBDD',
          200: '#EBD7BA',
          300: '#DEC091',
          400: '#CCA462',
          500: '#B8893B', // Antique Gold Accent
          600: '#9E712E',
          700: '#7E5627',
          800: '#674625',
          900: '#553B23',
          DEFAULT: '#B8893B',
        },
        warm: {
          50: '#FFFFFF',
          100: '#FDFCFB',
          200: '#FBF7F2', // Primary warm background
          300: '#F5EFE6',
          400: '#EBE3D7',
          500: '#DED3C3',
          600: '#C9BCAC',
          700: '#AFA190',
          800: '#8C7F70',
          900: '#695E52',
        },
        charcoal: {
          DEFAULT: '#2B2B2B',
          muted: '#66615C',
          light: '#8C857E',
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(155, 28, 49, 0.04), 0 1px 3px rgba(0, 0, 0, 0.05)',
        'soft-md': '0 4px 16px rgba(155, 28, 49, 0.08), 0 2px 6px rgba(0, 0, 0, 0.05)',
        'gold-glow': '0 0 15px rgba(184, 137, 59, 0.25)',
      },
      borderRadius: {
        'card': '12px',
      }
    },
  },
  plugins: [],
}
