import { useLoader } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { WaterMesh } from "three/examples/jsm/objects/WaterMesh.js";

type OceanProps = {
	size?: number;
	sunDirection?: THREE.Vector3;
	sunColor?: number;
	waterColor?: number;
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
	const waterNormals = useLoader(
		THREE.TextureLoader,
		"/water/waternormals.jpg",
	);
	// tile the texture across the huge plane
	waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

	const water = useMemo(() => {
		const geometry = new THREE.PlaneGeometry(size, size);
		const mesh = new WaterMesh(geometry, {
			waterNormals,
			sunDirection: sunDirection?.clone() ?? new THREE.Vector3(0.707, 0.707, 0),
			sunColor,
			waterColor,
			distortionScale,
		});
		mesh.rotation.x = -Math.PI / 2;
		return mesh;
	}, [size, waterNormals, sunDirection, sunColor, waterColor, distortionScale]);

	// keep sun direction uniform in sync if prop changes
	useEffect(() => {
		if (sunDirection) {
			water.sunDirection.value.copy(sunDirection);
		}
	}, [water, sunDirection]);

	return <primitive object={water} />;
}
