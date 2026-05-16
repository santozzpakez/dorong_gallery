module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}'
  ],
  safelist: [
    // Admin button color palette (TAG_COLORS & CAT_COLORS)
    { pattern: /^bg-(violet|sky|emerald|rose|amber|fuchsia|cyan|orange|teal|pink)-(100|200|800|900)/ },
    { pattern: /^text-(violet|sky|emerald|rose|amber|fuchsia|cyan|orange|teal|pink)-(300|800)/ },
    { pattern: /^border-(violet|sky|emerald|rose|amber|fuchsia|cyan|orange|teal|pink)-(300|600|700)/ },
    { pattern: /^hover:bg-(violet|sky|emerald|rose|amber|fuchsia|cyan|orange|teal|pink)-(200|800)/ },
    { pattern: /^dark:bg-(violet|sky|emerald|rose|amber|fuchsia|cyan|orange|teal|pink)-900/ },
    { pattern: /^dark:text-(violet|sky|emerald|rose|amber|fuchsia|cyan|orange|teal|pink)-300/ },
    { pattern: /^dark:border-(violet|sky|emerald|rose|amber|fuchsia|cyan|orange|teal|pink)-(600|700)/ },
    { pattern: /^dark:hover:bg-(violet|sky|emerald|rose|amber|fuchsia|cyan|orange|teal|pink)-800/ },
    // Opacity variants
    { pattern: /\/(40|50|60)$/ },
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#050505',
          50: '#111111'
        },
        'neon-cyan': '#00f3ff',
        'neon-purple': '#b026ff',
        'neon-pink': '#ff007f'
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 243, 255, 0.4), 0 0 40px rgba(0, 243, 255, 0.2)',
        'neon-purple': '0 0 15px rgba(176, 38, 255, 0.4), 0 0 40px rgba(176, 38, 255, 0.2)',
        'neon-pink': '0 0 15px rgba(255, 0, 127, 0.4), 0 0 40px rgba(255, 0, 127, 0.2)'
      },
      textShadow: {
        'neon-cyan': '0 0 10px rgba(0, 243, 255, 0.8), 0 0 20px rgba(0, 243, 255, 0.4)',
        'neon-purple': '0 0 10px rgba(176, 38, 255, 0.8), 0 0 20px rgba(176, 38, 255, 0.4)'
      }
    }
  },
  plugins: []
}
