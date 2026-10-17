import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger';
type Size = 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:opacity-90 disabled:opacity-40',
  secondary: 'bg-paper text-ink border-2 border-line hover:border-ink disabled:opacity-40',
  quiet: 'text-ink hover:bg-ink/5 disabled:opacity-40',
  danger: 'bg-paper text-stamp border-2 border-stamp/40 hover:border-stamp disabled:opacity-40',
};

const sizes: Record<Size, string> = {
  md: 'min-h-11 px-4 text-base',
  lg: 'min-h-14 px-6 text-lg',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra = '') {
  return `inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-[opacity,border-color,background-color] disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${extra}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}
