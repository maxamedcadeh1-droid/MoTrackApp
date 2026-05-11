import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// Tailwind CSS v4 is loaded by @tailwindcss/vite in vite.config.ts.
// Keep the package import here so the CSS toolchain fails early if Tailwind is missing.
void tailwindcss;

export default {
  plugins: [
    autoprefixer(),
  ],
};
