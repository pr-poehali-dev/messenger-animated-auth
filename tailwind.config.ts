import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}"
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: { '2xl': '1400px' }
		},
		extend: {
			fontFamily: {
				rubik: ['Rubik', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					from: { opacity: '0', transform: 'translateY(12px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-out': {
					from: { opacity: '1', transform: 'translateY(0)' },
					to: { opacity: '0', transform: 'translateY(12px)' }
				},
				'scale-in': {
					from: { opacity: '0', transform: 'scale(0.92)' },
					to: { opacity: '1', transform: 'scale(1)' }
				},
				'slide-in-right': {
					from: { opacity: '0', transform: 'translateX(100%)' },
					to: { opacity: '1', transform: 'translateX(0)' }
				},
				'slide-out-right': {
					from: { opacity: '1', transform: 'translateX(0)' },
					to: { opacity: '0', transform: 'translateX(100%)' }
				},
				'slide-up': {
					from: { opacity: '0', transform: 'translateY(100%)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'bubble-in': {
					from: { opacity: '0', transform: 'scale(0.5) translateY(8px)' },
					to: { opacity: '1', transform: 'scale(1) translateY(0)' }
				},
				'reaction-pop': {
					'0%': { transform: 'scale(0)' },
					'60%': { transform: 'scale(1.3)' },
					'100%': { transform: 'scale(1)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-6px)' }
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 0 0 rgba(139,92,246,0.4)' },
					'50%': { boxShadow: '0 0 0 8px rgba(139,92,246,0)' }
				},
				'shimmer': {
					from: { backgroundPosition: '-200% center' },
					to: { backgroundPosition: '200% center' }
				},
				'msg-in-left': {
					from: { opacity: '0', transform: 'translateX(-16px) scale(0.96)' },
					to: { opacity: '1', transform: 'translateX(0) scale(1)' }
				},
				'msg-in-right': {
					from: { opacity: '0', transform: 'translateX(16px) scale(0.96)' },
					to: { opacity: '1', transform: 'translateX(0) scale(1)' }
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.35s cubic-bezier(0.16,1,0.3,1)',
				'fade-out': 'fade-out 0.25s ease-in',
				'scale-in': 'scale-in 0.3s cubic-bezier(0.16,1,0.3,1)',
				'slide-in-right': 'slide-in-right 0.35s cubic-bezier(0.16,1,0.3,1)',
				'slide-out-right': 'slide-out-right 0.25s ease-in',
				'slide-up': 'slide-up 0.4s cubic-bezier(0.16,1,0.3,1)',
				'bubble-in': 'bubble-in 0.4s cubic-bezier(0.16,1,0.3,1)',
				'reaction-pop': 'reaction-pop 0.35s cubic-bezier(0.16,1,0.3,1)',
				'float': 'float 3s ease-in-out infinite',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'shimmer': 'shimmer 2.5s linear infinite',
				'msg-in-left': 'msg-in-left 0.3s cubic-bezier(0.16,1,0.3,1)',
				'msg-in-right': 'msg-in-right 0.3s cubic-bezier(0.16,1,0.3,1)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
