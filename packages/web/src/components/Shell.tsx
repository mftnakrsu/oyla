import type { ReactNode } from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';

/**
 * Page frame for the simple screens: logo, language switch, centred column. `fill` makes the
 * main area a flex column, so a page can centre its content in the first screen.
 */
export function Shell({
  children,
  wide = false,
  fill = false,
}: {
  children: ReactNode;
  wide?: boolean;
  fill?: boolean;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 pt-4 sm:px-6 sm:pt-6">
        <Logo />
        <LanguageSwitcher />
      </header>
      <main
        className={`mx-auto w-full flex-1 px-4 pb-12 pt-8 sm:px-6 ${wide ? 'max-w-5xl' : 'max-w-xl'} ${fill ? 'flex flex-col' : ''}`}
      >
        {children}
      </main>
    </div>
  );
}
