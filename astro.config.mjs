import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://nori-lang.dev',
  integrations: [
    starlight({
      title: 'Nori',
      description: 'A programming language for VRChat worlds that compiles to Udon Assembly.',
      logo: {
        light: './src/assets/logo-light.svg',
        dark: './src/assets/logo-dark.svg',
        replacesTitle: false,
      },
      social: {
        github: 'https://github.com/nori-lang/nori',
      },
      customCss: ['./src/styles/custom.css'],
      editLink: {
        baseUrl: 'https://github.com/nori-lang/nori/edit/main/docs-site/',
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Installation', slug: 'getting-started' },
            { label: 'Your First World', slug: 'getting-started/your-first-world' },
            { label: 'Examples', slug: 'getting-started/examples' },
          ],
        },
        {
          label: 'Language Reference',
          items: [
            { label: 'Overview', slug: 'language' },
            { label: 'Variables', slug: 'language/variables' },
            { label: 'Types', slug: 'language/types' },
            { label: 'Expressions', slug: 'language/expressions' },
            { label: 'Control Flow', slug: 'language/control-flow' },
            { label: 'Functions', slug: 'language/functions' },
            { label: 'Events', slug: 'language/events' },
            { label: 'Custom Events', slug: 'language/custom-events' },
            { label: 'Networking', slug: 'language/networking' },
            { label: 'Limitations', slug: 'language/limitations' },
          ],
        },
        {
          label: 'API Reference',
          autogenerate: { directory: 'api/generated' },
        },
        {
          label: 'Internals',
          items: [
            { label: 'The Udon VM', slug: 'internals/udon-vm' },
            { label: 'Assembly Format', slug: 'internals/assembly' },
            { label: 'Compilation', slug: 'internals/compilation' },
            { label: 'Debugging', slug: 'internals/debugging' },
          ],
        },
        {
          label: 'Error Index',
          items: [
            { label: 'All Errors', slug: 'errors' },
          ],
          collapsed: true,
        },
      ],
      head: [
        {
          tag: 'meta',
          attrs: { name: 'theme-color', content: '#7c3aed' },
        },
      ],
      pagefind: true,
    }),
  ],
});
