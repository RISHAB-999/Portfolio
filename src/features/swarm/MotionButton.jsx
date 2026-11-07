import { useSyncExternalStore } from 'react';
import { swarmStore } from './swarmStore';

// The "Motion" toggle for the swarm. Styled by `.motion-toggle` in index.css so
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
      <svg viewBox="0 0 16 16" aria-hidden="true" className="motion-toggle-icon">
        <path d="M2 1.5v9.2l2.5-2.2 1.7 3.8 1.6-.7-1.6-3.7h3.3z" />
        <path d="M9.5 6.5v6.4l1.7-1.5 1.2 2.6 1.1-.5-1.1-2.5h2.3z" opacity=".55" />
      </svg>
      <span>Motion</span>
    </button>
  );
};

export default MotionButton;
