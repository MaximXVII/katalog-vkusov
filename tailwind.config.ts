import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#FFFBF0',
          100: '#FEF3D0',
          200: '#FDE4A0',
          300: '#FBD070',
          400: '#F6BD55',
          500: '#EFA94A',
          600: '#D9890F',
          700: '#B36A0B',
          800: '#8A5008',
          900: '#624005',
          950: '#3D2703',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      screens: {
        xs: '475px',
      },
    },
  },
  plugins: [],
}

export default config
