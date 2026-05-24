import { defineConfig } from 'vitepress';

const docsBasePath = '/a2a-warp/';
const docsPublicUrl = 'https://oaslananka.github.io/a2a-warp/';

export default defineConfig({
  base: docsBasePath,
  title: 'A2A Warp',
  description: 'Independent TypeScript runtime and toolkit for the Agent2Agent protocol.',
  cleanUrls: true,
  lastUpdated: true,
  vite: {
    server: {
      host: '127.0.0.1',
    },
    preview: {
      host: '127.0.0.1',
    },
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${docsBasePath}logo.svg` }],
    ['meta', { property: 'og:image', content: `${docsPublicUrl}og-image.png` }],
    ['meta', { property: 'og:url', content: docsPublicUrl }],
  ],
  themeConfig: {
    siteTitle: 'A2A Warp',
    logo: `${docsBasePath}logo.svg`,
    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Packages', link: '/packages/core' },
      { text: 'Protocol', link: '/protocol/compliance' },
      { text: 'GitHub', link: 'https://github.com/oaslananka/a2a-warp' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quick-start' },
          ],
        },
      ],
      '/packages/': [
        {
          text: 'Packages',
          items: [
            { text: 'Core', link: '/packages/core' },
            { text: 'Client', link: '/packages/client' },
            { text: 'Adapters', link: '/packages/adapters' },
            { text: 'Registry', link: '/packages/registry' },
            { text: 'CLI', link: '/packages/cli' },
            { text: 'Scaffolder', link: '/packages/create-a2a-agent' },
            { text: 'MCP Bridge', link: '/packages/mcp-bridge' },
            { text: 'WebSocket', link: '/packages/ws' },
            { text: 'gRPC', link: '/packages/grpc' },
            { text: 'Testing', link: '/packages/testing' },
            { text: 'Codex Bridge', link: '/packages/codex-bridge' },
          ],
        },
      ],
      '/adapters/': [
        {
          text: 'Adapters',
          items: [
            { text: 'OpenAI', link: '/adapters/openai' },
            { text: 'Anthropic', link: '/adapters/anthropic' },
            { text: 'LangChain', link: '/adapters/langchain' },
            { text: 'Google ADK', link: '/adapters/google-adk' },
            { text: 'CrewAI', link: '/adapters/crewai' },
            { text: 'LlamaIndex', link: '/adapters/llamaindex' },
            { text: 'Custom Adapter', link: '/adapters/custom-adapter' },
          ],
        },
      ],
      '/protocol/': [
        {
          text: 'Protocol',
          items: [
            { text: 'Compatibility', link: '/protocol/compliance' },
            { text: 'JSON Schemas', link: '/protocol/schemas' },
            { text: 'Agent Cards', link: '/protocol/agent-card' },
            { text: 'Task Lifecycle', link: '/protocol/task-lifecycle' },
            { text: 'Extensions', link: '/protocol/extensions' },
            { text: 'Push Notifications', link: '/protocol/push-notifications' },
          ],
        },
      ],
      '/security/': [
        {
          text: 'Security',
          items: [
            { text: 'Authentication', link: '/security/authentication' },
            { text: 'Rate Limiting', link: '/security/rate-limiting' },
            { text: 'OIDC Publishing', link: '/security/oidc' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Core', link: '/api/core' },
            { text: 'Client', link: '/api/client' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/oaslananka/a2a-warp' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@oaslananka/a2a-warp' },
    ],
    footer: {
      message: 'Released under the Apache-2.0 License.',
      copyright: 'Copyright 2026 oaslananka',
    },
    search: {
      provider: 'local',
    },
  },
});
