import {useEffect, useRef, useState} from 'react';
import type {JSX} from 'react';

const AnimationExperience =
  require('@site/src/components/animation/AnimationExperience').default;

// Start the animation only once its section scrolls into view, so playback
// begins when the reader reaches "The protocol" rather than on page load.
export default function LazyAnimation(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (started) {
      return undefined;
    }
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }
    if (typeof IntersectionObserver === 'undefined') {
      setStarted(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setStarted(true);
          observer.disconnect();
        }
      },
      {threshold: 0.3},
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [started]);

  return (
    <div
      ref={containerRef}
      className={started ? 'scp-animation' : 'scp-animation__placeholder'}
      aria-hidden={started ? undefined : true}
    >
      {started ? <AnimationExperience /> : null}
    </div>
  );
}
