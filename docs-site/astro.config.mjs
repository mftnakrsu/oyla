// @ts-check
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

// The product introduction and documentation at https://oyla.mefby.com, published to GitHub Pages
// with a custom domain (set in the repository's Pages settings, not with a CNAME file, because the
// site deploys through GitHub Actions). The site lives at the root, so internal links start with `/`.
export default defineConfig({
  site: 'https://oyla.mefby.com',
  integrations: [
    starlight({
      title: 'Oyla',
      description:
        'Open-source, self-hostable live polls, word clouds, open questions and scales. The audience joins from their phones with a 6-digit code.',
      logo: { src: './src/assets/logo.svg' },
      favicon: '/favicon.svg',
      head: [
        {
          // The demo video and the question type clips autoplay. For people who ask for reduced
          // motion they stay paused and get controls, so they can still start them.
          tag: 'script',
          content:
            "document.addEventListener('DOMContentLoaded',()=>{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)return;for(const v of document.querySelectorAll('video[autoplay]')){v.autoplay=false;v.pause();v.controls=true;}});",
        },
      ],
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
