import { useSyncExternalStore } from 'react';
import { swarmStore } from './swarmStore';

// The "Rebuild" toggle for the swarm (Motion); reads "Stop" while it runs. Styled by `.motion-toggle` in index.css so
// it sits on the navbar's glass without adding another backdrop-filter layer.
// `data-swarm-keep` keeps it visible and clickable while the page is "blank".
const MotionButton = ({ className = '' }) => {
  const active = useSyncExternalStore(swarmStore.subscribe, swarmStore.getSnapshot, swarmStore.getServerSnapshot);

  return (
    <button
      type="button"
      data-motion-toggle=""
      data-swarm-keep=""
      aria-pressed={active}
      title={active ? 'Stop the swarm (Esc)' : 'Watch a swarm of cursors rebuild this page'}
      onClick={swarmStore.toggle}
      onPointerEnter={swarmStore.preload}
      onFocus={swarmStore.preload}
      onTouchStart={swarmStore.preload}
      className={`motion-toggle font-source-code-pro ${className}`}
    >
      {/* Two crew pointers. On hover they swap once: the front one rises up
          and settles behind, the back one dips down and comes to the front.
          Each pointer is three layers so x, y and size can ease separately
          (that's what makes the arc); z-index flips halfway through. */}
      <span className="motion-toggle-icon" aria-hidden="true">
        {['a', 'b'].map((k) => (
          <span key={k} className={`crew-ptr crew-ptr-${k}`}>
            <span className="crew-ptr-y">
              <svg viewBox="0 0 16 16" className="crew-ptr-shape">
                <path d="M2 2 14.5 7 8.8 8.8 7 14.5Z" />
              </svg>
            </span>
          </span>
        ))}
      </span>
      <span>{active ? 'Stop' : 'Rebuild'}</span>
    </button>
  );
};

export default MotionButton;
