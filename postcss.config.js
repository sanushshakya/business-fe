module.exports = {
  // Define the plugins array to hold all necessary PostCSS plugins
  plugins: [
    require('tailwindcss'), // Plugin for Tailwind CSS
    require('@shadcn/ui/dist/tailwind.config.mjs'), // Plugin for shadcn/ui with Tailwind integration
    require('postcss-import'), // Plugin to handle @import rules in CSS files
    require('postcss-preset-env')({ stage: 1 }), // Plugin to use modern CSS features
    require('autoprefixer'), // Plugin to automatically add vendor prefixes to CSS properties
    require('cssnano'), // Plugin for minifying CSS output
  ],
};