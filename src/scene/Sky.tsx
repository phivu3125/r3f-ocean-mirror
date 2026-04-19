import { useEffect, useMemo } from "react";
import { Vector3 } from "three";
import { SkyMesh } from "three/examples/jsm/objects/SkyMesh.js";

export type SkyProps = {
	distance?: number;
	sunPosition?: [number, number, number] | Vector3;
	turbidity?: number;
	rayleigh?: number;
	mieCoefficient?: number;
	mieDirectionalG?: number;
};

function setSunPosition(
	target: Vector3,
	source: [number, number, number] | Vector3,
): void {
	if (source instanceof Vector3) {
		target.copy(source);
	} else {
		target.set(source[0], source[1], source[2]);
	}
}

export function Sky({
	distance = 450000,
	sunPosition = [0, 1, 0],
	turbidity = 10,
	rayleigh = 2,
	mieCoefficient = 0.005,
	mieDirectionalG = 0.8,
}: SkyProps): React.ReactElement {
	const mesh = useMemo(() => {
		const sky = new SkyMesh();
		sky.frustumCulled = false;
		return sky;
	}, []);

	useEffect(() => {
		mesh.scale.setScalar(distance);
		mesh.turbidity.value = turbidity;
		mesh.rayleigh.value = rayleigh;
		mesh.mieCoefficient.value = mieCoefficient;
		mesh.mieDirectionalG.value = mieDirectionalG;
		setSunPosition(mesh.sunPosition.value, sunPosition);
	}, [
		mesh,
		distance,
		turbidity,
		rayleigh,
		mieCoefficient,
		mieDirectionalG,
		sunPosition,
	]);

	return <primitive object={mesh} />;
}
