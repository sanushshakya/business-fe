/**
 * PostCSS configuration file to define the necessary plugins for processing CSS.
 *
 * @module postcss.config.js
 */

module.exports = {
  plugins: [
    require('postcss-import'), // Must come first so @import rules are inlined before Tailwind runs
    require('tailwindcss'),
    require('postcss-preset-env')({ stage: 1 }), // Use modern CSS features
    require('autoprefixer'),
    // Minify only production builds
    ...(process.env.NODE_ENV === 'production' ? [require('cssnano')] : []),
  ],
};
