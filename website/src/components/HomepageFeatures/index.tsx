import Heading from '@theme/Heading';
import {useBaseUrlUtils} from '@docusaurus/useBaseUrl';

const features = [
  {
    icon: '/img/animation/objects/so_paper.svg',
    body: 'Organize claims, figures, datasets, code, methods, assumptions, and provenance into a structured SCP package that preserves evidence status.',
    kicker: 'Package',
    title: 'Agent-readable study context',
  },
  {
    icon: '/img/animation/icons/method.svg',
    body: (
      <>
        Use <code>scicon validate</code> to catch broken IDs, illegal
        predicates, missing references, and unresolved package gaps before the
        server starts.
      </>
    ),
    kicker: 'Validate',
    title: 'Deterministic checks before serving',
  },
  {
    icon: '/img/animation/icons/folder.svg',
    body: (
      <>
        Bootstrap trusted MCP registration plus coding-agent guidance with{' '}
        <code>scicon init</code>, while preserving user content outside managed
        regions.
      </>
    ),
    kicker: 'Bootstrap',
    title: 'Repository setup for supported agents',
  },
  {
    icon: '/img/animation/icons/story/mcp-interaction.png',
    body: 'Expose a read-only MCP interface that returns structured objects, evidence statuses, and citations instead of speculative prose.',
    kicker: 'Serve',
    title: 'Grounded inspection over MCP',
  },
];

export default function HomepageFeatures() {
  const {withBaseUrl} = useBaseUrlUtils();
  return (
    <section className="feature-section">
      <div className="feature-section__header">
        <p className="eyebrow">The implementation</p>
        <Heading as="h2" className="feature-section__title">
          What SciCon does today.
        </Heading>
        <p className="feature-section__body">
          Four commands to author study context, check it, register the MCP
          server, and serve it read-only to agents.
        </p>
      </div>
      <div className="feature-grid">
        {features.map((feature) => (
          <article className="feature-card" key={feature.title}>
            <img className="feature-card__icon" src={withBaseUrl(feature.icon)} alt="" />
            <span className="feature-card__kicker">{feature.kicker}</span>
            <Heading as="h3" className="feature-card__title">{feature.title}</Heading>
            <p className="feature-card__body">{feature.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
