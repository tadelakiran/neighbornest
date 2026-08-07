/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Dark mode via class on <html> — most reliable approach
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ── Blue Dynasty surfaces ──
        void:    '#0a0f1c', // page background
        deep:    '#0f172e', // panels / wells
        surface: '#162044', // cards
        raised:  '#1e2d5f', // hovers / tags / inputs

        // ── Blue Dynasty accent (sky-based, accent-400 is the primary) ──
        accent: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#38bdf8',
          400: '#0ea5e9',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#082f49',
          950: '#062441',
        },

        // ── Text hierarchy ──
        primary:   '#f8fafc',
        secondary: '#94a3b8',
        muted:     '#64748b',

        // ── Legacy palettes kept for compatibility with existing components ──
        blue: {
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
        navy: {
          950: '#0a0f1c',
          900: '#0f172e',
          800: '#162044',
          700: '#1e2d5f',
          600: '#27406f',
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
        xs:   '0 1px 2px rgba(2,6,23,0.4)',
        sm:   '0 2px 8px rgba(2,6,23,0.45), 0 1px 3px rgba(0,0,0,0.4)',
        md:   '0 4px 20px rgba(2,6,23,0.5), 0 2px 8px rgba(0,0,0,0.4)',
        lg:   '0 8px 32px rgba(2,6,23,0.6), 0 4px 12px rgba(0,0,0,0.45)',
        xl:   '0 16px 48px rgba(2,6,23,0.7), 0 8px 20px rgba(0,0,0,0.5)',
        card: '0 2px 8px rgba(2,6,23,0.35)',
        'card-hover': '0 8px 32px rgba(14,165,233,0.18), 0 4px 12px rgba(2,6,23,0.5)',
        glow: '0 0 0 3px rgba(14,165,233,0.18), 0 4px 20px rgba(14,165,233,0.28)',
        'glow-sm': '0 0 12px rgba(14,165,233,0.22)',
        'inner-top': 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #38bdf8 100%)',
        'hero-gradient':   'linear-gradient(135deg, #082f49 0%, #0c4a6e 40%, #0ea5e9 100%)',
        'card-gradient':   'linear-gradient(145deg, #162044 0%, #0f172e 100%)',
        'button-gradient': 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #38bdf8 100%)',
        'glow-gradient':   'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(14,165,233,0.12), transparent 40%)',
      },
      keyframes: {
        fadeUp:  { from: { opacity:'0', transform:'translateY(10px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        fadeIn:  { from: { opacity:'0' },                               to: { opacity:'1' } },
        slideUp: { from: { opacity:'0', transform:'translateY(14px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        scaleIn: { from: { opacity:'0', transform:'scale(0.94)' },      to: { opacity:'1', transform:'scale(1)' } },
        toastIn: { from: { opacity:'0', transform:'translateX(100%)' }, to: { opacity:'1', transform:'translateX(0)' } },
        float:   { '0%,100%': { transform:'translateY(0)' }, '50%': { transform:'translateY(-10px)' } },
        shimmer: { from: { transform:'translateX(-100%)' },             to: { transform:'translateX(200%)' } },
        loadBar: { from: { transform:'translateX(-100%)' },             to: { transform:'translateX(200%)' } },
        pulseGlow: {
          '0%,100%': { boxShadow:'0 0 0 0 rgba(14,165,233,0.45)' },
          '50%':     { boxShadow:'0 0 0 8px rgba(14,165,233,0)'  },
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
        shimmer:    'shimmer 1.8s linear infinite',
        loadBar:    'loadBar 1s ease-in-out infinite',
        pulseGlow:  'pulseGlow 2s ease-in-out infinite',
        spinSlow:   'spinSlow 8s linear infinite',
      },
    },
  },
  plugins: [],
};
