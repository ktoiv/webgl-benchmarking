import { Mesh, Matrix4,BufferGeometry, BufferAttribute, MeshStandardMaterial, Color, DoubleSide, Group } from "three"
import { addFullObject, addMesh, addSimpleObject, hasFirstLoaded, markFullyLoaded, setFirstLoaded } from "../state/state-management";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { setFirstDecodedTime, setFirstLoadedTime, setFullyDecodedTime, setFullyLoadedTime, setStartDecodedTime } from "../state/timing-management";



const loadJsonUrlToTheScene = (checkpoint, urls, position, scene) => {

    setStartDecodedTime(checkpoint);

    const promises = []

    urls.forEach(url => {
        const promise = new Promise((resolve, reject) => {
            fetch(new URL(url))
                .then(response => response.json())
                .then(meshJson => createMeshFromJson(meshJson))
                .then(mesh => {
        
                    mesh.position.x += position.x;
                    mesh.position.z += position.z;
        
                    scene.add(mesh);
        
                    resolve();
                    return;

                });
        });

        promises.push(promise);
    })

    Promise.all(promises).then(() => {
        setFirstLoaded(checkpoint);
        markFullyLoaded(checkpoint);
        
        setFirstLoadedTime(checkpoint);
        setFullyLoadedTime(checkpoint);

        setFullyDecodedTime(checkpoint);
    })
}

const helperMatrix = new Matrix4();


const createMeshFromJson = ( meshJsonArray ) => {

    const parentMesh = new Group();

    meshJsonArray.forEach(meshJson => {
        const geometry = new BufferGeometry();

        const vertices = Object.values(meshJson.vertices)
        const vertexCount =  vertices.length;
        const posFloats = new Float32Array( vertexCount / 2) ;
        const normFloats = new Float32Array(vertexCount / 2);

        const faces = Uint32Array.from(Object.values(meshJson.indices));
    
    
        for (let i = 0; i < vertexCount; i += 6) {
    
                posFloats[i / 2] = vertices[i];
                posFloats[i / 2 + 1] = vertices[i + 1];
                posFloats[i / 2 + 2] = vertices[i + 2];
    
                normFloats[i / 2] = vertices[i + 3];
                normFloats[i / 2 + 1 ] = vertices[i + 4];
                normFloats[i / 2 + 2] = vertices[i + 5];   
        }


    
        geometry.setAttribute('position', new BufferAttribute(posFloats, 3));
        geometry.setAttribute('normal', new BufferAttribute(normFloats, 3));
        geometry.setIndex(new BufferAttribute(faces, 1));


        const mat = new MeshStandardMaterial({
            color: new Color(meshJson.color[0], meshJson.color[2],meshJson.color[2]),
            side: DoubleSide
        });
    
        helperMatrix.fromArray(meshJson.transformation);
        const threeMesh = new Mesh(geometry, mat)
    
        threeMesh.matrix = helperMatrix.clone();
        threeMesh.matrixAutoUpdate = false;


        parentMesh.add(threeMesh);
    })

    return parentMesh;
}


const loader = new GLTFLoader();


const loadGlTFUrlsToTheScene = (checkpoint, urls, position, params, lodWorker, scene, simple) => {

    const group = new Group();

    if (!simple) {
        setStartDecodedTime(checkpoint);
    }

    return new Promise((resolve, reject) => {
        const promises = []
        urls.forEach(url => {
            const individualFilePromise = new Promise((individualResolve, individualReject) => {
                loader.loadAsync(url, () => {})
                    .then( gltf => {
                        
                        gltf.scene.position.x += position.x
                        gltf.scene.position.z += position.z
        
                        group.add(gltf.scene);


                        if (params['Active scene management'] && !simple) {
                            gltf.scene.traverse(child => {
                                if (child.isMesh) {
                                    addMesh(child.uuid, child);
                                    lodWorker.postMessage({
                                        type: 'ADD-MESH',
                                        min: child.geometry.boundingBox.min.toArray(),
                                        max: child.geometry.boundingBox.max.toArray(),
                                        position: position.toArray(),
                                        uuid: child.uuid
                                    });
                                }
                            })

                        }

                        individualResolve()
                    })
            })

            promises.push(individualFilePromise);
        })

        Promise.all(promises).then(() =>{
            if (!hasFirstLoaded(checkpoint)) {
                setFirstLoaded(checkpoint);
                setFirstLoadedTime(checkpoint);
            }

            if (simple) {
                addSimpleObject(checkpoint, group);
            } else {
                markFullyLoaded(checkpoint);
                setFullyLoadedTime(checkpoint);
                addFullObject(checkpoint, group);     
                setFullyDecodedTime(checkpoint);              
            }

            if (params['Level-of-detail']) {
                group.visible = false;
            }

            scene.add(group);
            resolve()
        });
    })
}


export {loadJsonUrlToTheScene, loadGlTFUrlsToTheScene}