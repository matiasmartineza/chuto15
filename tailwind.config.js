import animate from 'tailwindcss-animate';

export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: { extend: { fontFamily: { neon: ['"Tilt Neon"', 'Outfit', 'sans-serif'], body: ['Outfit', 'system-ui', 'sans-serif'] } } },
  plugins: [animate],
};
