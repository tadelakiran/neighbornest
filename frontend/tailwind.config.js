/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ── Azure Dynasty surfaces ──
        // Theme-aware: these resolve to CSS variables that flip with the
        // active theme (see index.css). Making them variables is what makes
        // the dark/light toggle actually restyle every component that uses
        // these tokens (text-primary, bg-void, …) without per-file work.
        void:     'var(--color-bg)',
        deep:     'var(--color-deep)',
        surface:  'var(--color-surface)',
        surface2: 'var(--color-surface-2)',
        'surface-2': 'var(--color-surface-2)',
        raised:   'var(--color-raised)',

        // ── Accent — light blue (primary) ──
        accent: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },

        // ── Royal — saturated dark blue (secondary emphasis, danger states) ──
        royal: {
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },

        // ── Text hierarchy (theme-aware via CSS variables) ──
        primary:   'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted:     'var(--text-muted)',
        subtle:    'var(--text-subtle)',

        // ── Semantic status — all blues (theme-aware via CSS variables) ──
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger:  'var(--error)',
        error:   'var(--error)',

        // ── Sky — light blue, directly usable without var indirection ──
        sky: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },

        // ── Navy — dark blue surfaces ──
        navy: {
          950: '#060b18',
          900: '#0a1226',
          800: '#0e1830',
          700: '#14203f',
          600: '#1b2a52',
        },
      },
      borderRadius: {
        xs:   '6px',
        sm:   '8px',
        md:   '10px',
        lg:   '14px',
        xl:   '18px',
        '2xl':'24px',
        '3xl':'32px',
      },
      boxShadow: {
        // Theme-aware: resolve through CSS variables so light mode gets soft,
        // low-opacity shadows instead of the dark-mode navy depths.
        xs:   'var(--shadow-xs)',
        sm:   'var(--shadow-sm)',
        md:   'var(--shadow-md)',
        lg:   'var(--shadow-lg)',
        xl:   'var(--shadow-xl)',
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        glow: 'var(--shadow-glow)',
        'glow-sm': 'var(--shadow-glow-sm)',
        'inner-top': 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 45%, #38bdf8 100%)',
        'hero-gradient':   'linear-gradient(135deg, #060b18 0%, #0c4a6e 45%, #0ea5e9 100%)',
        'card-gradient':   'linear-gradient(145deg, var(--color-surface) 0%, var(--color-deep) 100%)',
        'button-gradient': 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #38bdf8 100%)',
        'glow-gradient':   'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(56,189,248,0.14), transparent 40%)',
      },
      keyframes: {
        fadeUp:  { from: { opacity:'0', transform:'translateY(10px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        fadeIn:  { from: { opacity:'0' },                               to: { opacity:'1' } },
        slideUp: { from: { opacity:'0', transform:'translateY(14px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        scaleIn: { from: { opacity:'0', transform:'scale(0.94)' },      to: { opacity:'1', transform:'scale(1)' } },
        toastIn: { from: { opacity:'0', transform:'translateX(100%)' }, to: { opacity:'1', transform:'translateX(0)' } },
        float:   { '0%,100%': { transform:'translateY(0)' }, '50%': { transform:'translateY(-10px)' } },
        'float-soft': { '0%,100%': { transform:'translateY(0)' }, '50%': { transform:'translateY(-6px)' } },
        shimmer: { from: { transform:'translateX(-100%)' },             to: { transform:'translateX(200%)' } },
        loadBar: { from: { transform:'translateX(-100%)' },             to: { transform:'translateX(200%)' } },
        pulseGlow: {
          '0%,100%': { boxShadow:'0 0 0 0 rgba(56,189,248,0.45)' },
          '50%':     { boxShadow:'0 0 0 8px rgba(56,189,248,0)'  },
        },
        spinSlow: { to: { transform:'rotate(360deg)' } },
      },
      animation: {
        fadeUp:     'fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) forwards',
        fadeIn:     'fadeIn 0.3s ease forwards',
        slideUp:    'slideUp 0.35s cubic-bezier(0.22,1,0.36,1) forwards',
        scaleIn:    'scaleIn 0.25s cubic-bezier(0.22,1,0.36,1) forwards',
        toastIn:    'toastIn 0.3s ease forwards',
        float:      'float 5s ease-in-out infinite',
        'float-soft': 'float-soft 6s ease-in-out infinite',
        shimmer:    'shimmer 1.8s linear infinite',
        loadBar:    'loadBar 1s ease-in-out infinite',
        pulseGlow:  'pulseGlow 2s ease-in-out infinite',
        spinSlow:   'spinSlow 8s linear infinite',
      },
    },
  },
  plugins: [],
};
