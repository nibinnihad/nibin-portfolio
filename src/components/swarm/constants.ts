/**
 * Master switch for the swarm rebuild and its Replay button. Set to false to
 * turn the animation off (e.g. while redesigning the UI).
 */
export const SWARM_ENABLED = true;

/** sessionStorage key: records that the rebuild has played (it still auto-plays on every page open). */
export const SWARM_SESSION_KEY = "nn-swarm-rebuilt";

/**
 * Attribute set on <html> before first paint when the rebuild should
 * auto-play. A data attribute (not a class) so React hydration of <html>
 * leaves it alone.
 */
export const SWARM_PENDING_ATTR = "data-swarm-pending";

/**
 * Attribute on <html> while the rebuild is building. Self-animating widgets
 * (e.g. the drifting skills strip) hold still so the swarm can build them in place.
 */
export const SWARM_RUNNING_ATTR = "data-swarm-running";

/**
 * Marks a container whose contents the swarm builds later, once it has settled (the
 * profile cards ride a 3D ribbon first). Its children stay hidden while the rebuild runs;
 * dispatch SWARM_APPEND_EVENT with the containers when they are ready to be built.
 */
export const SWARM_DEFER_ATTR = "data-swarm-defer";
export const SWARM_APPEND_EVENT = "swarm:append";

/**
 * Runs inline in <head> before the page paints. It opts the visit into the
 * rebuild on every page open (hiding content until the engine takes over),
 * unless the visitor prefers reduced motion or deep-linked to a section.
 * Content is never hidden if this script fails.
 */
export const SWARM_PREPAINT_SCRIPT = `(function(){try{if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;if(location.hash)return;document.documentElement.setAttribute("${SWARM_PENDING_ATTR}","")}catch(e){}})();`;
