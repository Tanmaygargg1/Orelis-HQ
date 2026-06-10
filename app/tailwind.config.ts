import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:'#080810', surface:'#0F0F1A', card:'#131320', border:'#1A1A2E',
        gold:'#C8A96E', 'gold-light':'#E8C98E',
        success:'#4CAF7D', danger:'#E05C5C', amber:'#F59E0B',
        't1':'#F0F0F5', 't2':'#8888AA', 't3':'#444466',
      },
      fontFamily: { sans: ['Inter','sans-serif'], mono: ['JetBrains Mono','monospace'] },
    }
  },
  plugins: [],
}
export default config
