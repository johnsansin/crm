import baseConfig from '../frontend/tailwind.config.js'

export default {
  ...baseConfig,
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../frontend/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
}
