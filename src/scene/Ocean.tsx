import { useFrame, useLoader } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";

type OceanProps = {
	size?: number;
	sunDirection?: THREE.Vector3;
	sunColor?: THREE.ColorRepresentation;
	waterColor?: THREE.ColorRepresentation;
	distortionScale?: number;
};

/**
 * Realistic ocean surface using three.js' built-in planar-reflection Water.
 * The reflection renders the scene (including drei <Sky/>) into an offscreen
 * render target each frame and samples it with animated normal-map distortion.
 */
export function Ocean({
	size = 10000,
	sunDirection,
	sunColor = 0xffffff,
	waterColor = 0x001e2f,
	distortionScale = 3.7,
}: OceanProps) {
	const ref = useRef<Water>(null);

	const waterNormals = useLoader(
		THREE.TextureLoader,
		"/water/waternormals.jpg",
	);
	// tile the texture across the huge plane
	waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

	const water = useMemo(() => {
		const geometry = new THREE.PlaneGeometry(size, size);
		const mesh = new Water(geometry, {
			textureWidth: 512,
			textureHeight: 512,
			waterNormals,
			sunDirection: sunDirection?.clone() ?? new THREE.Vector3(0.707, 0.707, 0),
			sunColor,
			waterColor,
			distortionScale,
			fog: true,
		});
		mesh.rotation.x = -Math.PI / 2;
		return mesh;
	}, [size, waterNormals, sunColor, waterColor, distortionScale]);
	// sunDirection handled via uniform update below so live changes work

	// keep sun direction uniform in sync if prop changes
	if (sunDirection) {
		(water.material.uniforms.sunDirection.value as THREE.Vector3).copy(
			sunDirection,
		);
	}

	useFrame((_, delta) => {
		water.material.uniforms.time.value += delta;
	});

	return <primitive object={water} ref={ref} />;
}
