/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas)',
        surface: 'var(--surface)',
        'surface-muted': 'var(--surface-muted)',
        stroke: 'var(--stroke)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        'accent-muted': 'var(--accent-muted)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)'
      },
      boxShadow: {
        soft: '0 20px 60px rgba(23, 21, 18, 0.08)',
        panel: '0 24px 80px rgba(23, 21, 18, 0.1)',
        lift: '0 18px 40px rgba(23, 21, 18, 0.08)'
      }
    }
  },
  plugins: []
};
