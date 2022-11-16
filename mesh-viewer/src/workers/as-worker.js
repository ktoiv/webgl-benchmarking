import { Frustum, Matrix4, Vector3 } from "three";


const sizeMap = new Map();
const positionMap = new Map();

self.onmessage = ({ data }) => {


	if (data.type === "ADD-MESH") {
		addMeshToWorker(data);
	}

	if (data.type === "UPDATE") {
		updateVisibility(data);
	}
};


const _v1 = new Vector3();
const _v2 = new Vector3();


const addMeshToWorker = (data) => {

	const minVec = _v1.fromArray(data.min);
	const maxVec = _v2.fromArray(data.max);
	sizeMap.set(data.uuid, minVec.distanceTo(maxVec));

	const boxCenter = minVec.add(maxVec).divideScalar(2);
	
	const pos = new Vector3().fromArray(data.position).add(boxCenter);

	positionMap.set(data.uuid, pos);
}


const cameraPos = new Vector3();

const updateVisibility = (data) => {
	cameraPos.fromArray(data.pos);

	const visible = []
	const notVisible = []

	positionMap.forEach((position, uuid) => {
		if (cameraPos.distanceTo(position) / sizeMap.get(uuid) > 60) {
			notVisible.push(uuid);
		}
		else {
			visible.push(uuid);
		}
	});


	self.postMessage({
		visible,
		notVisible
	});
} 
