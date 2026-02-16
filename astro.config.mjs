import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://nori-lang.dev',
  integrations: [
    starlight({
      title: 'Nori',
      favicon: '/favicon.ico',
      description: 'A programming language for VRChat worlds that compiles to Udon Assembly.',
      logo: {
        src: './src/assets/nori_roll.png',
        replacesTitle: false,
      },
      social: {
        github: 'https://github.com/norilang/nori',
        'x.com': 'https://x.com/nori_lang',
      },
      customCss: ['./src/styles/custom.css'],
      editLink: {
        baseUrl: 'https://github.com/norilang/nori-lang.dev/edit/main/',
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Installation', slug: 'getting-started' },
            { label: 'Unity Workflow', slug: 'getting-started/unity-workflow' },
            { label: 'Your First World', slug: 'getting-started/your-first-world' },
            { label: 'Examples', slug: 'getting-started/examples' },
          ],
        },
        {
          label: 'Editor Setup',
          items: [
            { label: 'Overview', slug: 'editors' },
            { label: 'VS Code', slug: 'editors/vscode' },
            { label: 'JetBrains Rider', slug: 'editors/rider' },
            { label: 'Visual Studio', slug: 'editors/visual-studio' },
            { label: 'Building the LSP Server', slug: 'editors/building-the-lsp' },
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
        {
          tag: 'meta',
          attrs: { property: 'og:image', content: 'https://nori-lang.dev/og-image.png' },
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:card', content: 'summary' },
        },
      ],
      pagefind: true,
    }),
  ],
});
