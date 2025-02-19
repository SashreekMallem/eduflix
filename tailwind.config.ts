import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: "#1a1a2e",
        foreground: "#e94560",
        primary: "#0f3460",
        secondary: "#16213e",
        accent: "#e94560",
        muted: "#a6a6a6",
        'glass-bg': 'rgba(26, 26, 46, 0.8)',
        'glass-border': 'rgba(233, 69, 96, 0.6)',
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(5px)',
      },
      boxShadow: {
        'none': 'none',
      },
      transitionProperty: {
        '3d': 'transform',
      },
      transitionDuration: {
        '3d': '0.6s',
      },
      transitionTimingFunction: {
        '3d': 'ease-in-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
} satisfies Config;
