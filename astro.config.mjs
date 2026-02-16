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
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        ja: { label: '日本語', lang: 'ja' },
      },
      sidebar: [
        {
          label: 'Getting Started',
          translations: { ja: 'はじめに' },
          items: [
            { label: 'Installation', slug: 'getting-started', translations: { ja: 'インストール' } },
            { label: 'Unity Workflow', slug: 'getting-started/unity-workflow', translations: { ja: 'Unity ワークフロー' } },
            { label: 'Your First World', slug: 'getting-started/your-first-world', translations: { ja: 'はじめてのワールド' } },
            { label: 'Examples', slug: 'getting-started/examples', translations: { ja: 'サンプル' } },
          ],
        },
        {
          label: 'Editor Setup',
          translations: { ja: 'エディタ設定' },
          items: [
            { label: 'Overview', slug: 'editors', translations: { ja: '概要' } },
            { label: 'VS Code', slug: 'editors/vscode', translations: { ja: 'VS Code' } },
            { label: 'JetBrains Rider', slug: 'editors/rider', translations: { ja: 'JetBrains Rider' } },
            { label: 'Visual Studio', slug: 'editors/visual-studio', translations: { ja: 'Visual Studio' } },
            { label: 'Building the LSP Server', slug: 'editors/building-the-lsp', translations: { ja: 'LSP サーバーのビルド' } },
          ],
        },
        {
          label: 'Language Reference',
          translations: { ja: '言語リファレンス' },
          items: [
            { label: 'Overview', slug: 'language', translations: { ja: '概要' } },
            { label: 'Variables', slug: 'language/variables', translations: { ja: '変数' } },
            { label: 'Types', slug: 'language/types', translations: { ja: '型' } },
            { label: 'Expressions', slug: 'language/expressions', translations: { ja: '式' } },
            { label: 'Control Flow', slug: 'language/control-flow', translations: { ja: '制御フロー' } },
            { label: 'Functions', slug: 'language/functions', translations: { ja: '関数' } },
            { label: 'Events', slug: 'language/events', translations: { ja: 'イベント' } },
            { label: 'Custom Events', slug: 'language/custom-events', translations: { ja: 'カスタムイベント' } },
            { label: 'Networking', slug: 'language/networking', translations: { ja: 'ネットワーキング' } },
            { label: 'Limitations', slug: 'language/limitations', translations: { ja: '制限事項' } },
          ],
        },
        {
          label: 'API Reference',
          translations: { ja: 'API リファレンス' },
          autogenerate: { directory: 'api/generated' },
        },
        {
          label: 'Internals',
          translations: { ja: '内部仕様' },
          items: [
            { label: 'The Udon VM', slug: 'internals/udon-vm', translations: { ja: 'Udon VM' } },
            { label: 'Assembly Format', slug: 'internals/assembly', translations: { ja: 'アセンブリ形式' } },
            { label: 'Compilation', slug: 'internals/compilation', translations: { ja: 'コンパイル' } },
            { label: 'Debugging', slug: 'internals/debugging', translations: { ja: 'デバッグ' } },
          ],
        },
        {
          label: 'Error Index',
          translations: { ja: 'エラー一覧' },
          items: [
            { label: 'All Errors', slug: 'errors', translations: { ja: '全エラー' } },
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
