import type { Config } from 'tailwindcss'

/**
 * Design system: "Risograph Craft Zine 手作志"（见 DESIGN.md）
 * 暖纸 + 黑墨描边 + 三色 spot ink（粉/蓝/黄）+ 半调网点 + 硬实色块投影。
 * token 命名沿用既有（paper/ink/coral/teal/slate），值已全部换为 riso 体系，
 * 故各组件自动继承新配色；coral=粉(主)，teal=riso 蓝(次)，新增 sun=riso 黄。
 * 编辑器中性 chrome 走 slate.*，刻意低饱和以保证真实豆色读数准确。
 */
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#FFFDF7',
          100: '#FBF7EF',
          200: '#F2ECDD',
          300: '#E6DEC9',
          400: '#CBBFA3',
        },
        ink: {
          DEFAULT: '#1A1A1A',
          soft: '#5C5648',
          faint: '#8C8472',
        },
        // 主 spot ink —— 荧光桃粉
        coral: {
          DEFAULT: '#FF4D6D',
          dark: '#E83A59',
          soft: '#FFDCE3',
        },
        // 次 spot ink —— riso 蓝
        teal: {
          DEFAULT: '#2B5FE3',
          dark: '#1E47B5',
          soft: '#D6E0FB',
        },
        // 点缀 spot ink —— riso 黄
        sun: {
          DEFAULT: '#FFC53D',
          dark: '#E9A91F',
          soft: '#FFEFC2',
        },
        // 编辑器中性 chrome（暖灰）
        slate: {
          0: '#FCFBF8',
          50: '#F3F1EC',
          100: '#E9E7E0',
          200: '#E2DFD7',
          300: '#C9C5BB',
          600: '#5C5850',
          700: '#403D37',
          800: '#2A2825',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        // 硬实色块投影（油印签名，无 blur）
        sticker: '3px 3px 0 #1A1A1A',
        'sticker-sm': '2px 2px 0 #1A1A1A',
        pop: '6px 6px 0 #1A1A1A',
        'pop-lg': '9px 9px 0 #1A1A1A',
        pink: '4px 4px 0 #FF4D6D',
        // 柔影：仅工具页面板使用，保持安静
        soft: '0 10px 30px -18px rgba(26,26,26,0.4)',
        'soft-lg': '0 24px 48px -24px rgba(26,26,26,0.45)',
        // 兼容既有引用（编辑器/预览/弹窗）：柔和卡片影 + 拼豆凹凸感
        craft: '0 1px 2px rgba(26,26,26,0.04), 0 8px 24px -12px rgba(26,26,26,0.18)',
        'craft-lg': '0 2px 4px rgba(26,26,26,0.05), 0 24px 48px -20px rgba(26,26,26,0.28)',
        peg: 'inset 0 1px 2px rgba(255,255,255,0.7), inset 0 -2px 3px rgba(26,26,26,0.12)',
      },
      borderRadius: {
        bead: '9999px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'bead-spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.55s cubic-bezier(0.22,1,0.36,1) both',
        'pop-in': 'pop-in 0.28s cubic-bezier(0.22,1,0.36,1) both',
        'bead-spin': 'bead-spin 0.9s linear infinite',
        marquee: 'marquee 24s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
