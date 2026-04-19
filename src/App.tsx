import { OrbitControls, Sky } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { FloatingObjects } from "./scene/FloatingObjects";
import { Ocean } from "./scene/Ocean";
import { StatsPanel, StatsUpdater } from "./ui/StatsPanel";

/**
 * Compute sun cartesian direction from drei Sky's spherical params.
 * Mirrors drei Sky's internal math so the Water reflections align with the sun in the skybox.
 */
function sunDirectionFrom(elevation: number, azimuth: number) {
	const phi = THREE.MathUtils.degToRad(90 - elevation);
	const theta = THREE.MathUtils.degToRad(azimuth);
	const v = new THREE.Vector3();
	v.setFromSphericalCoords(1, phi, theta);
	return v;
}

export default function App() {
	// Fixed "golden hour" sun to match the reference project's warm look
	const elevation = 3.5; // degrees above horizon -> warm, low sun
	const azimuth = 180; // south

	const sunDirection = useMemo(
		() => sunDirectionFrom(elevation, azimuth),
		[elevation, azimuth],
	);
	const sunPosition = useMemo(
		() => sunDirection.clone().multiplyScalar(1000),
		[sunDirection],
	);

	return (
		<div style={{ position: "fixed", inset: 0, background: "#0b1d2a" }}>
			<Canvas
				shadows
				camera={{ position: [14, 3.5, 18], fov: 55, near: 0.1, far: 20000 }}
				gl={{
					antialias: true,
					toneMapping: THREE.ACESFilmicToneMapping,
					toneMappingExposure: 0.55,
					outputColorSpace: THREE.SRGBColorSpace,
				}}
			>
				<Suspense fallback={null}>
					<Sky
						distance={450000}
						sunPosition={sunPosition.toArray()}
						turbidity={10}
						rayleigh={2}
						mieCoefficient={0.005}
						mieDirectionalG={0.8}
					/>
					<Ocean
						size={10000}
						sunDirection={sunDirection}
						sunColor={0xffffff}
						waterColor={0x001e2f}
						distortionScale={3.7}
					/>
					<FloatingObjects />

					<hemisphereLight args={[0xdfe9f3, 0x0a1824, 0.35]} />
					<directionalLight
						position={sunPosition
							.clone()
							.normalize()
							.multiplyScalar(50)
							.toArray()}
						intensity={1.2}
						color={0xfff1d6}
						castShadow
						shadow-mapSize-width={1024}
						shadow-mapSize-height={1024}
					/>
				</Suspense>

				<OrbitControls
					enableDamping
					dampingFactor={0.08}
					minPolarAngle={0}
					maxPolarAngle={Math.PI / 2 - 0.05}
					minDistance={4}
					maxDistance={120}
					target={[0, 0, 0]}
				/>
				<StatsUpdater />
			</Canvas>
			<StatsPanel />
		</div>
	);
}
