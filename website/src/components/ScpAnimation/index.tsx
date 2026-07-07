import BrowserOnly from '@docusaurus/BrowserOnly';
import type {JSX} from 'react';
import '@site/src/css/animation.css';

export default function ScpAnimation(): JSX.Element {
  return (
    <BrowserOnly fallback={<div className="scp-animation__placeholder" aria-hidden="true" />}>
      {() => {
        const LazyAnimation = require('./LazyAnimation').default;
        return <LazyAnimation />;
      }}
    </BrowserOnly>
  );
}
