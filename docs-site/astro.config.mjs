// @ts-check
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

// Published to GitHub Pages at https://mftnakrsu.github.io/oyla/.
// Links inside the content include the `/oyla` base, because Markdown links are not rewritten.
export default defineConfig({
  site: 'https://mftnakrsu.github.io',
  base: '/oyla',
  integrations: [
    starlight({
      title: 'Oyla',
      description:
        'Open-source, self-hostable live polls, word clouds, open questions and scales. The audience joins from their phones with a 6-digit code.',
      logo: { src: './src/assets/logo.svg' },
      favicon: '/favicon.svg',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/mftnakrsu/oyla' }],
      editLink: { baseUrl: 'https://github.com/mftnakrsu/oyla/edit/main/docs-site/' },
      locales: {
        root: { label: 'English', lang: 'en' },
        tr: { label: 'Türkçe', lang: 'tr' },
      },
      customCss: ['./src/styles/custom.css'],
      // src/pages/404.astro renders the 404 page instead.
      disable404Route: true,
      sidebar: [
        {
          label: 'User guide',
          translations: { tr: 'Kullanım kılavuzu' },
          items: ['guide/presenting', 'guide/joining', 'guide/question-types'],
        },
        {
          label: 'Self-hosting',
          translations: { tr: 'Kendi sunucunuzda' },
          items: ['self-hosting/docker', 'self-hosting/railway', 'self-hosting/configuration'],
        },
        {
          label: 'Development',
          translations: { tr: 'Geliştirme' },
          items: [
            'development/architecture',
            'development/contributing',
            'development/adding-a-question-type',
          ],
        },
        {
          label: 'Project',
          translations: { tr: 'Proje' },
          items: ['security', 'roadmap'],
        },
      ],
    }),
  ],
});
