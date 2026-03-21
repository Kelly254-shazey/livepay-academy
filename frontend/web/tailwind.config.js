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
        'surface-secondary': 'var(--surface-secondary)',
        stroke: 'var(--stroke)',
        'stroke-subtle': 'var(--stroke-subtle)',
        text: 'var(--text)',
        'text-secondary': 'var(--text-secondary)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        'accent-light': 'var(--accent-light)',
        'accent-dark': 'var(--accent-dark)',
        'accent-muted': 'var(--accent-muted)',
        success: 'var(--success)',
        'success-light': 'var(--success-light)',
        'success-dark': 'var(--success-dark)',
        warning: 'var(--warning)',
        'warning-light': 'var(--warning-light)',
        'warning-dark': 'var(--warning-dark)',
        danger: 'var(--danger)',
        'danger-light': 'var(--danger-light)',
        'danger-dark': 'var(--danger-dark)',
        info: 'var(--info)',
        'info-light': 'var(--info-light)',
        'info-dark': 'var(--info-dark)',
        'role-creator': 'var(--role-creator)',
        'role-viewer': 'var(--role-viewer)',
        'role-admin': 'var(--role-admin)',
        'role-moderator': 'var(--role-moderator)',
      },
      boxShadow: {
        soft: '0 20px 60px rgba(13, 29, 27, 0.08)',
        panel: '0 24px 80px rgba(13, 29, 27, 0.12)',
        lift: '0 18px 40px rgba(13, 29, 27, 0.08)',
        'glass': '0 8px 32px rgba(15, 118, 110, 0.1)',
        'glass-lg': '0 12px 48px rgba(15, 118, 110, 0.15)',
        'soft-hover': '0 24px 64px rgba(13, 29, 27, 0.12)',
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '18px',
        xl: '24px'
      }
    }
  },
  plugins: []
};
