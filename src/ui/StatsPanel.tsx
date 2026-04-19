import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import Stats from "stats.js";

/**
 * Singleton stats.js instance. Shared between <StatsUpdater/> (inside the R3F
 * Canvas, begins/ends each frame) and <StatsPanel/> (outside the Canvas, owns
 * the DOM card). This avoids running a parallel requestAnimationFrame loop —
 * we reuse the Canvas's own render tick.
 */
let statsSingleton: Stats | null = null;
function getStats(): Stats {
	if (!statsSingleton) {
		statsSingleton = new Stats();
		statsSingleton.showPanel(0); // 0: fps, 1: ms, 2: mb
		// Neutralize stats.js's default fixed-corner positioning so it flows
		// inside our card instead of pinning itself to the viewport.
		statsSingleton.dom.style.position = "relative";
		statsSingleton.dom.style.top = "0";
		statsSingleton.dom.style.left = "0";
		statsSingleton.dom.style.opacity = "1";
		statsSingleton.dom.style.cursor = "pointer"; // clicking cycles fps/ms/mb
	}
	return statsSingleton;
}

/**
 * Ticks stats.js once per R3F render frame. MUST be rendered inside <Canvas>.
 * useFrame priority -1000 runs before all other frame callbacks so `begin()`
 * brackets the whole frame; a follow-up rAF calls `end()` after paint. This
 * measures the actual rendered frame time, not just CPU work.
 */
export function StatsUpdater() {
	useFrame(() => {
		const stats = getStats();
		stats.end(); // close previous frame's panel
		stats.begin(); // open next frame
	}, -1000);
	return null;
}

/**
 * Collapsible performance panel with Next.js-style floating-pill behavior.
 * - Open: stats.js DOM (FPS / ms / MB) in a glass card, top-left.
 * - Closed: collapses to a small round activity icon; click to expand.
 *
 * The stats singleton is created lazily and shared with <StatsUpdater/>. No
 * parallel rAF loop — the Canvas render tick drives the counters.
 */
export function StatsPanel() {
	const [open, setOpen] = useState(true);
	const hostRef = useRef<HTMLDivElement>(null);

	// Ensure the singleton exists even if <StatsUpdater/> mounts later (or not
	// at all, e.g. when Canvas hasn't rendered yet). This also keeps the DOM
	// node stable across open/close toggles.
	useEffect(() => {
		getStats();
	}, []);

	// Mount/unmount the stats DOM into our host whenever `open` flips.
	useEffect(() => {
		const host = hostRef.current;
		if (!host) return;
		const stats = getStats();
		if (open) {
			host.appendChild(stats.dom);
		} else if (stats.dom.parentElement === host) {
			host.removeChild(stats.dom);
		}
	}, [open]);

	return (
		<div style={containerStyle}>
			{open ? (
				<div style={cardStyle}>
					<div style={headerStyle}>
						<span style={titleStyle}>Performance</span>
						<button
							type="button"
							onClick={() => setOpen(false)}
							aria-label="Hide performance panel"
							style={closeButtonStyle}
						>
							×
						</button>
					</div>
					<div ref={hostRef} style={statsHostStyle} />
				</div>
			) : (
				<button
					type="button"
					onClick={() => setOpen(true)}
					aria-label="Show performance panel"
					style={pillButtonStyle}
				>
					<ActivityIcon />
				</button>
			)}
		</div>
	);
}

function ActivityIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.25"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M22 12h-4l-3 9L9 3l-3 9H2" />
		</svg>
	);
}

// -------- styles (inline, no CSS file needed) --------

// Anchor to the TOP-LEFT corner, respecting iOS safe-area insets so the panel
// never hides under the status bar / dynamic island. `viewport-fit=cover` on the
// <meta viewport> tag in index.html is required for env() to return real values.
const containerStyle: React.CSSProperties = {
	position: "fixed",
	top: "calc(env(safe-area-inset-top, 0px) + 12px)",
	left: "calc(env(safe-area-inset-left, 0px) + 12px)",
	zIndex: 1000,
	fontFamily:
		"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
	color: "#e8eef5",
	// Prevent the panel itself from swallowing OrbitControls drags on most of the
	// screen — only the card/pill is interactive. The container is zero-size.
	pointerEvents: "none",
};

const cardStyle: React.CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: 6,
	padding: 8,
	background: "rgba(14, 22, 32, 0.78)",
	border: "1px solid rgba(255, 255, 255, 0.08)",
	borderRadius: 12,
	backdropFilter: "blur(10px)",
	WebkitBackdropFilter: "blur(10px)",
	boxShadow:
		"0 8px 24px rgba(0, 0, 0, 0.35), 0 1px 0 rgba(255, 255, 255, 0.04) inset",
	transition: "opacity 160ms ease, transform 160ms ease",
	pointerEvents: "auto",
};

const headerStyle: React.CSSProperties = {
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	gap: 8,
	padding: "0 2px",
};

const titleStyle: React.CSSProperties = {
	fontSize: 11,
	fontWeight: 600,
	letterSpacing: 0.4,
	textTransform: "uppercase",
	color: "#9fb3c8",
};

const closeButtonStyle: React.CSSProperties = {
	appearance: "none",
	background: "transparent",
	border: "none",
	color: "#9fb3c8",
	fontSize: 18,
	lineHeight: 1,
	cursor: "pointer",
	padding: "2px 6px",
	borderRadius: 6,
};

const statsHostStyle: React.CSSProperties = {
	// stats.js DOM is 80x48, slightly framed
	borderRadius: 8,
	overflow: "hidden",
};

const pillButtonStyle: React.CSSProperties = {
	appearance: "none",
	width: 36,
	height: 36,
	borderRadius: "50%",
	background: "rgba(14, 22, 32, 0.82)",
	border: "1px solid rgba(255, 255, 255, 0.1)",
	color: "#cfe0f1",
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	cursor: "pointer",
	boxShadow:
		"0 6px 16px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255, 255, 255, 0.05) inset",
	transition: "transform 120ms ease, background 120ms ease",
	pointerEvents: "auto",
	// Ensure the icon isn't tappable through to OrbitControls on touch devices.
	touchAction: "manipulation",
};
