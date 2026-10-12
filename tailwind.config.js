// tailwind.config.js

module.exports = {
  // Files scanned for class names; unused styles are removed from production builds
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  
  // Enable dark mode based on user preference or media query
  darkMode: 'media',
  
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
  
  plugins: [],
}