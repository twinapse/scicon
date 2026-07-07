import Link from '@docusaurus/Link';
import {useBaseUrlUtils} from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import HomepageFeatures from '../components/HomepageFeatures';
import VideoEmbed from '../components/VideoEmbed';
import ScpAnimation from '../components/ScpAnimation';
import styles from './index.module.css';

type HomepageCustomFields = {
  homepageVideoPoster?: string;
  homepageVideoUrl?: string | null;
};

const docs = [
  {description: 'Project orientation, workflow, and participant roles.', label: 'Overview', to: '/docs/overview'},
  {description: 'Repository bootstrap for supported coding-agent tooling.', label: 'Repository bootstrap', to: '/docs/init'},
  {description: 'Package files, object shapes, and provenance edges.', label: 'Package schema', to: '/docs/package-schema'},
  {description: 'Validation checks, severity levels, and report behavior.', label: 'Validation', to: '/docs/validation'},
  {description: 'MCP registration, resources, tools, and serving behavior.', label: 'MCP server', to: '/docs/mcp-server'},
  {description: 'The protocol specification and normative requirements.', label: 'Protocol', to: '/docs/protocol'},
  {description: 'Core SCP terminology and package-server vocabulary.', label: 'Glossary', to: '/docs/glossary'},
];

const heroGraphNodes = [
  {icon: '/img/animation/icons/idea.svg', id: 'claim', label: 'Claim', tone: 'accent', x: 50, y: 14},
  {icon: '/img/animation/icons/figure.svg', id: 'figure', label: 'Figure', tone: 'paper', x: 22, y: 40},
  {icon: '/img/animation/icons/method.svg', id: 'method-step', label: 'Method step', tone: 'code', x: 78, y: 40},
  {icon: '/img/animation/objects/so_paper.svg', id: 'paper-section', label: 'Paper section', tone: 'paper', x: 12, y: 84},
  {icon: '/img/animation/icons/folder.svg', id: 'dataset', label: 'Dataset', tone: 'data', x: 50, y: 84},
  {icon: '/img/animation/objects/so_code.svg', id: 'code-artifact', label: 'Code artifact', tone: 'code', x: 88, y: 84},
] as const;

const heroGraphEdges = [
  ['claim', 'figure'],
  ['claim', 'method-step'],
  ['claim', 'paper-section'],
  ['figure', 'paper-section'],
  ['figure', 'dataset'],
  ['method-step', 'dataset'],
  ['method-step', 'code-artifact'],
  ['dataset', 'code-artifact'],
] as const;

function HomepageHeader() {
  const {withBaseUrl} = useBaseUrlUtils();
  const heroGraphNodeById = Object.fromEntries(
    heroGraphNodes.map((node) => [node.id, node]),
  );

  return (
    <header className={styles.hero}>
      <div className={styles.heroCopy}>
        <p className="eyebrow">Scientific Context Protocol</p>
        <Heading as="h1" className={styles.heroTitle}>
          Ground scientific answers in structured evidence.
        </Heading>
        <p className={styles.heroBody}>
          The Scientific Context Protocol (<strong>SCP</strong>) defines an
          agent-readable layer for grounded inspection of scientific outputs.{' '}
          <strong>SciCon</strong> is its reference implementation: package a
          study's claims, figures, data,
          methods, and provenance, validate it, and serve it to agents over MCP.
        </p>
        <div className={styles.heroActions}>
          <Link className="button button--primary button--lg" to="/docs/overview">Get started</Link>
          <Link className="button button--secondary button--lg" href="https://github.com/twinapse/scicon">GitHub</Link>
        </div>
        <p className={styles.heroNote}>
          MVP —{' '}
          <Link href="https://github.com/twinapse/scicon/blob/main/README.md#current-status">
            see current status
          </Link>
          .
        </p>
      </div>
      <div className={styles.heroVisual}>
        <div className={styles.graphFrame}>
          <div className={styles.outputRow}>
            <figure className={`${styles.outputTile} ${styles.paperTile}`}>
              <img src={withBaseUrl('/img/animation/objects/so_paper.svg')} alt="" />
              <figcaption>Paper</figcaption>
            </figure>
            <figure className={`${styles.outputTile} ${styles.codeTile}`}>
              <img src={withBaseUrl('/img/animation/objects/so_code.svg')} alt="" />
              <figcaption>Code</figcaption>
            </figure>
            <figure className={`${styles.outputTile} ${styles.dataTile}`}>
              <img src={withBaseUrl('/img/animation/objects/so_dataset.svg')} alt="" />
              <figcaption>Data</figcaption>
            </figure>
          </div>
          <div className={styles.graphArrow} aria-hidden="true">↓</div>
          <div className={styles.heroGraph} aria-hidden="true">
            <svg
              className={styles.heroGraphEdges}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {heroGraphEdges.map(([from, to]) => (
                <line
                  key={`${from}-${to}`}
                  className={styles.heroGraphEdge}
                  x1={heroGraphNodeById[from].x}
                  y1={heroGraphNodeById[from].y}
                  x2={heroGraphNodeById[to].x}
                  y2={heroGraphNodeById[to].y}
                />
              ))}
            </svg>
            {heroGraphNodes.map((node) => (
              <div
                key={node.id}
                className={styles.heroGraphNode}
                data-tone={node.tone}
                style={{left: `${node.x}%`, top: `${node.y}%`}}
              >
                <img src={withBaseUrl(node.icon)} alt="" />
                <span className={styles.heroGraphNodeLabel}>{node.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className={styles.visualCaption}>
          Outputs become a structured knowledge graph that agents inspect over MCP.
        </p>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  const {withBaseUrl} = useBaseUrlUtils();
  const customFields = (siteConfig.customFields ?? {}) as HomepageCustomFields;
  const homepageVideoPoster = withBaseUrl(customFields.homepageVideoPoster ?? '/img/video-poster.svg');
  const homepageVideoUrl = customFields.homepageVideoUrl || undefined;

  return (
    <Layout
        description="SciCon is the Docusaurus site for the Scientific Context Protocol reference implementation."
        title={siteConfig.title}
    >
      <div className={styles.page}>
        <HomepageHeader />
        <main className={styles.main}>
          <section className={styles.installSection}>
            <div>
              <p className="eyebrow">Install</p>
              <Heading as="h2" className={styles.sectionTitle}>
                Start with a lightweight authoring and serving loop.
              </Heading>
              <p className={styles.sectionBody}>
                Install the package, register the MCP server in your repository,
                and validate the structured package before you serve it.
              </p>
            </div>
            <div className={styles.commandPanel}>
              <pre className={styles.commandBlock}>
                <code>{`pip install scicon
scicon init .
scicon validate --package-dir scp-package
scicon serve --package-dir scp-package`}</code>
              </pre>
            </div>
          </section>

          <section className={styles.animationSection}>
            <div className={styles.docsHeading}>
              <p className="eyebrow">The protocol</p>
              <Heading as="h2" className={styles.sectionTitle}>From scientific output to grounded answers.</Heading>
              <p className={styles.sectionBody}>
                SCP&rsquo;s pipeline: research outputs become a structured
                knowledge graph that an agent reaches over MCP to answer with
                grounded, cited evidence.
              </p>
            </div>
            <ScpAnimation />
          </section>

          <HomepageFeatures />

          <section className={styles.docsSection}>
            <div className={styles.docsHeading}>
              <p className="eyebrow">Documentation</p>
              <Heading as="h2" className={styles.sectionTitle}>Browse the docs.</Heading>
              <p className={styles.sectionBody}>
                Start with the guides that help you package scientific context,
                validate it, and serve it to agents over MCP.
              </p>
            </div>
            <div className={styles.docsGrid}>
              {docs.map((doc) => (
                <Link className={styles.docCard} key={doc.to} to={doc.to}>
                  <span className={styles.docLabel}>{doc.label}</span>
                  <span className={styles.docDescription}>{doc.description}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className={styles.mediaSection}>
            <div className={styles.mediaCopy}>
              <p className="eyebrow">Demo</p>
              <Heading as="h2" className={styles.sectionTitle}>Watch grounded question answering in action.</Heading>
              <p className={styles.sectionBody}>
                A short walkthrough of an agent answering several questions using
                the SCP knowledge graph over MCP.
              </p>
            </div>
            {homepageVideoUrl ? (
              <VideoEmbed poster={homepageVideoPoster} title="SciCon question-answering demo" url={homepageVideoUrl} />
            ) : (
              <div className={styles.mediaPlaceholder}>
                <img alt="Placeholder poster for the SciCon demo video." className={styles.posterImage} src={homepageVideoPoster} />
                <p className={styles.placeholderText}>
                  Add an embeddable demo video URL to show the walkthrough here.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </Layout>
  );
}
