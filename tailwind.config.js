/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,svelte,js,ts}'],
  theme: {
    extend: {
      // Customizing max-width utilities
      maxWidth: {
        'custom': '900px',  // Add a custom max-width class
      },
      // Customizing the default container plugin
      container: {
        center: true,
        padding: '1rem',
        screens: {
          'lg': '1024px',  // Custom max-width for large screens
          // 'xl': '1080px', // Custom max-width for extra-large screens
          'xl': '1024px', // Custom max-width for extra-large screens
        },
      },
    },
  },
  plugins: [],
}

