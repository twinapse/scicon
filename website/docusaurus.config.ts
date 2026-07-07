import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'SciCon',
  tagline: 'An agent-readable layer for scientific outputs, served over MCP',
  favicon: 'img/favicon.svg',
  url: 'https://twinapse.github.io',
  baseUrl: '/scicon/',
  organizationName: 'twinapse',
  projectName: 'scicon',
  trailingSlash: false,
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  customFields: {
    homepageVideoPoster: process.env.SCICON_HOMEPAGE_VIDEO_POSTER ?? '/img/video-poster.svg',
    homepageVideoUrl:
      process.env.SCICON_HOMEPAGE_VIDEO_URL ??
      'https://raw.githubusercontent.com/twinapse/scicon-assets/main/videos/question-answering.mp4',
  },
  presets: [
    [
      'classic',
      {
        docs: {
          editUrl: ({docPath}) =>
            `https://github.com/twinapse/scicon/blob/main/docs/${docPath}`,
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    image: 'img/social-card.svg',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'SciCon',
      logo: {
        alt: 'SciCon logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          label: 'Docs',
          position: 'left',
          to: '/docs/overview',
        },
        {
          href: 'https://github.com/twinapse/scicon',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Overview',
              to: '/docs/overview',
            },
            {
              label: 'MCP server',
              to: '/docs/mcp-server',
            },
            {
              label: 'Protocol',
              to: '/docs/protocol',
            },
          ],
        },
        {
          title: 'Project',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/twinapse/scicon',
            },
            {
              label: 'PyPI',
              href: 'https://pypi.org/project/scicon/',
            },
          ],
        },
        {
          title: 'Legal',
          items: [
            {
              label: 'MIT license',
              href: 'https://github.com/twinapse/scicon/blob/main/LICENSE',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Twinapse.`,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
