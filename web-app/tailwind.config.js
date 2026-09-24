/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Palette sampled from Figure 13 of the thesis. Do not re-theme.
        sidebar: {
          DEFAULT: '#1F3B2D', // dark plantation green sidebar
          deep: '#172E23', // sidebar model card / hover
          active: '#386943', // active navigation pill
          text: '#C7D8CC', // idle navigation label
        },
        primary: {
          DEFAULT: '#3F8E4F', // primary green buttons
          dark: '#357A44',
          light: '#6FAE77',
        },
        success: {
          bg: '#F0F8F2', // prediction result card background
          border: '#D5E9DA',
        },
        info: {
          bg: '#EFF5FC',
          border: '#D5E3F5',
          icon: '#2563EB',
          text: '#33517A',
        },
        page: '#F1F5F2', // application background behind the panel
        card: '#FFFFFF',
        line: '#E1E7E2', // subtle borders
        ink: '#24332A', // main text
        muted: '#66756B', // secondary text
        positive: '#4C9A5A', // positive SHAP contribution
        negative: '#C7352F', // negative SHAP contribution
      },
      fontFamily: {
        sans: [
          'Inter',
          'Segoe UI',
          'system-ui',
          '-apple-system',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        // Compact type scale matching the thesis figure
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        panel: '0 1px 2px rgba(31, 59, 45, 0.06)',
      },
    },
  },
  plugins: [],
}
