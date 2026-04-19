import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type Floater = {
	kind: "crate" | "plank" | "branch";
	position: [number, number, number];
	scale: number;
	yaw: number;
	phase: number;
	color: THREE.ColorRepresentation;
	accent?: THREE.ColorRepresentation;
};

// Warm driftwood palette — tuned to read bright against the golden-hour sky.
// Using emissive tint + lower roughness so objects don't silhouette to black
// when the sun is behind them.
const FLOATERS: Floater[] = [
	{
		kind: "crate",
		position: [-6, 0, -3],
		scale: 1.0,
		yaw: 0.35,
		phase: 0.0,
		color: 0xb07a42, // oak
		accent: 0x6b4521, // banding / nails
	},
	{
		kind: "crate",
		position: [8, 0, 5],
		scale: 0.85,
		yaw: -0.6,
		phase: 1.4,
		color: 0xc78f55, // lighter oak
		accent: 0x7a5028,
	},
	{
		kind: "plank",
		position: [2, 0, -9],
		scale: 1.2,
		yaw: 0.9,
		phase: 2.3,
		color: 0xb88855, // weathered pine
	},
	{
		kind: "plank",
		position: [-10, 0, 7],
		scale: 1.0,
		yaw: -0.25,
		phase: 0.8,
		color: 0xa87748, // saddle
	},
	{
		kind: "branch",
		position: [11, 0, -7],
		scale: 1.15,
		yaw: -0.4,
		phase: 1.9,
		color: 0x8c6138, // driftwood brown
	},
	{
		kind: "branch",
		position: [-4, 0, 9],
		scale: 0.9,
		yaw: 1.3,
		phase: 3.1,
		color: 0x9c6f42,
	},
	{
		kind: "branch",
		position: [5, 0, 11],
		scale: 0.75,
		yaw: 0.2,
		phase: 2.6,
		color: 0xa87b4d,
	},
];

/**
 * CPU-side ambient bob for floating objects.
 * Water surface itself is geometrically flat (Water.js only perturbs normals
 * via the reflection shader), so objects bob with stacked sine waves for a
 * believable roll/pitch on calm swell. Deterministic, no pointer interaction.
 */
export function FloatingObjects() {
	return (
		<group>
			{FLOATERS.map((f, i) => (
				<FloatingObject key={i} floater={f} />
			))}
		</group>
	);
}

function FloatingObject({ floater }: { floater: Floater }) {
	const group = useRef<THREE.Group>(null);
	const base = useMemo(
		() => new THREE.Vector3(...floater.position),
		[floater.position],
	);

	useFrame(({ clock }) => {
		if (!group.current) return;
		const t = clock.elapsedTime + floater.phase;
		const bob = Math.sin(t * 0.9) * 0.18 + Math.sin(t * 1.7 + 1.3) * 0.08;
		const roll = Math.sin(t * 0.8 + 0.5) * 0.08;
		const pitch = Math.sin(t * 1.1) * 0.06;
		group.current.position.set(base.x, base.y + bob, base.z);
		group.current.rotation.set(pitch, floater.yaw, roll);
	});

	return (
		<group ref={group} scale={floater.scale}>
			{floater.kind === "crate" && (
				<CrateMesh color={floater.color} accent={floater.accent!} />
			)}
			{floater.kind === "plank" && <PlankMesh color={floater.color} />}
			{floater.kind === "branch" && <BranchMesh color={floater.color} />}
		</group>
	);
}

/**
 * Wooden crate: main box + 4 banding strips on vertical edges for silhouette.
 * Emissive tint (~12% of base color) keeps it visible when backlit by sun.
 */
function CrateMesh({
	color,
	accent,
}: {
	color: THREE.ColorRepresentation;
	accent: THREE.ColorRepresentation;
}) {
	const bodyEmissive = useMemo(
		() => new THREE.Color(color).multiplyScalar(0.18),
		[color],
	);
	return (
		<group position={[0, 0.1, 0]}>
			{/* main crate body */}
			<mesh castShadow receiveShadow>
				<boxGeometry args={[0.9, 0.8, 0.9]} />
				<meshStandardMaterial
					color={color}
					emissive={bodyEmissive}
					emissiveIntensity={1.0}
					roughness={0.6}
					metalness={0.0}
				/>
			</mesh>
			{/* horizontal banding (top & bottom) */}
			<mesh castShadow position={[0, 0.36, 0]}>
				<boxGeometry args={[0.94, 0.06, 0.94]} />
				<meshStandardMaterial color={accent} roughness={0.7} metalness={0.0} />
			</mesh>
			<mesh castShadow position={[0, -0.36, 0]}>
				<boxGeometry args={[0.94, 0.06, 0.94]} />
				<meshStandardMaterial color={accent} roughness={0.7} metalness={0.0} />
			</mesh>
		</group>
	);
}

/**
 * Wood plank: thin elongated box. Slight warm emissive so it reads bright.
 */
function PlankMesh({ color }: { color: THREE.ColorRepresentation }) {
	const emissive = useMemo(
		() => new THREE.Color(color).multiplyScalar(0.2),
		[color],
	);
	return (
		<mesh castShadow receiveShadow position={[0, 0.06, 0]}>
			<boxGeometry args={[2.4, 0.12, 0.5]} />
			<meshStandardMaterial
				color={color}
				emissive={emissive}
				emissiveIntensity={1.0}
				roughness={0.65}
				metalness={0.0}
			/>
		</mesh>
	);
}

/**
 * Tree branch: main cylinder + 2 smaller twigs forked off at angles.
 * All cylinders oriented along X (local), group rotation handles yaw.
 */
function BranchMesh({ color }: { color: THREE.ColorRepresentation }) {
	const emissive = useMemo(
		() => new THREE.Color(color).multiplyScalar(0.18),
		[color],
	);
	const mat = (
		<meshStandardMaterial
			color={color}
			emissive={emissive}
			emissiveIntensity={1.0}
			roughness={0.75}
			metalness={0.0}
		/>
	);
	return (
		<group position={[0, 0.1, 0]}>
			{/* main trunk — rotated so it lies flat along X */}
			<mesh castShadow receiveShadow rotation={[0, 0, Math.PI / 2]}>
				<cylinderGeometry args={[0.1, 0.13, 2.2, 10]} />
				{mat}
			</mesh>
			{/* twig 1 — forked off near one end */}
			<mesh
				castShadow
				position={[0.6, 0.1, 0.25]}
				rotation={[0, 0.6, Math.PI / 2.4]}
			>
				<cylinderGeometry args={[0.05, 0.07, 0.9, 8]} />
				{mat}
			</mesh>
			{/* twig 2 — smaller fork the other direction */}
			<mesh
				castShadow
				position={[-0.5, 0.08, -0.2]}
				rotation={[0, -0.5, Math.PI / 2.2]}
			>
				<cylinderGeometry args={[0.04, 0.06, 0.7, 8]} />
				{mat}
			</mesh>
		</group>
	);
}
