// tailwind.config.js

module.exports = {
  // Define the purge option to remove unused styles in production builds
  purge: ['./src/**/*.js', './src/**/*.jsx', './src/**/*.ts', './src/**/*.tsx'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '3xl': '1536px',
        // Add custom breakpoints for smaller screens
        'xs': '390px',
      },
      colors: {
        'primary': '#1e40af',
        'secondary': '#6b7280',
        'success': '#4ade80',
        'danger': '#fca5a5',
        'info': '#60a5fa',
        'warning': '#fbbf24',
      },
      spacing: {
        '1/2': '50%',
        '3/4': '75%',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}