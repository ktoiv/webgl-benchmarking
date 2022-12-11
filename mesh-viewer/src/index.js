
import { PerspectiveCamera, Scene, sRGBEncoding, WebGLRenderer, GridHelper, Color, AmbientLight, Vector3, Clock, Frustum, Matrix4 } from "three";
import CameraControls from 'camera-controls';
import { GUI } from 'dat.gui'

import * as THREE from 'three';
import { loadGlTFUrlsToTheScene, loadJsonUrlToTheScene } from "./utils/mesh-utils";
import { getFullObject, getMesh, getSimpleObject, hasFullObject, hasSimpleObject, isFullyLoaded } from "./state/state-management";
import { animateToCheckpoint } from "./utils/animation-utils";
import { getDecodeStats, getEvents, getStats, benchmarkStart } from "./state/timing-management";
CameraControls.install({ THREE: THREE });



const init = () => {

    const container = document.createElement('div');
    document.body.appendChild(container);


    const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 25000);

    const clock = new Clock();

    const scene = new Scene();
    scene.background = new Color('white')

    const renderer = new WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = sRGBEncoding;
    container.appendChild(renderer.domElement);

    const controls = new CameraControls(camera, renderer.domElement);
    controls.setLookAt(10, 100, 10, 0, 0, 0);

    const lodWorker = new Worker(new URL('./workers/as-worker.js', import.meta.url));

    const positionMap = new Map();
    const fullUrlMap = new Map();
    const multipleUrlMap = new Map();
    const simpleUrlMap = new Map();
    const jsonUrlMap = new Map();


    let fpsCounter = 0;
    let seconds = 0;
    const results = []

    let fpsIntervalId;
    const render = () => {

        const delta = clock.getDelta();
        const hasControlsUpdated = controls.update(delta);

        fpsCounter++;

        requestAnimationFrame(render);

        if (hasControlsUpdated) {
            renderer.render(scene, camera);
        }

    }


    const startFPSCounter = () => {
        fpsIntervalId = setInterval(() => {
            const seconds = (Date.now() - benchmarkStart) / 1000
            const result = {
                'TIME': seconds,
                'FPS': fpsCounter
            }
    
            results.push(result);
            fpsCounter = 0;
        }, 1000);
    }



    const gui = new GUI({ width: 285 });

    const params = {
        'File format': 'glTF',
        'On-demand loading' : false,
        'Multiple files' : false,
        'Level-of-detail': false,
        'Active scene management' : false
    }

    const formatOptions = ['glTF', 'JSON']

    const options = gui.addFolder("Benchmark options");
    options.add(params, 'File format', formatOptions),
    options.add(params, 'On-demand loading'),
    options.add(params, 'Multiple files');
    options.add(params, 'Level-of-detail');
    options.add(params, 'Active scene management');

    options.open();

    const obj = { START: () => { startAnimation(params) } };

    gui.add(obj, 'START');

    const light = new AmbientLight(0x404040);
    scene.add(light);


    const zeroPlane = new GridHelper(20000, 1000);
    //zeroPlane.rotateX(Math.PI / 2);

    scene.add(zeroPlane);
    //controls.enabled = false;

    const frustum = new Frustum();
    const helperMat4 = new Matrix4()


    const startAnimation = (params) => {
        const promiseArray = [];

        benchmarkStart = Date.now()

        startFPSCounter()
        for (let i = 1; i < 6; i++) {


            const promise = new Promise((resolve, reject) => {
                fetch('http://localhost:5000/checkpoint/' + i)
                    .then(resp => resp.json())
                    .then(body => {
                        const position = new Vector3(body.position.x, body.position.y, body.position.z)

                        fullUrlMap.set(i, body.full_urls);
                        simpleUrlMap.set(i, body.simple_urls);
                        multipleUrlMap.set(i, body.multiple_urls);
                        jsonUrlMap.set(i, body.json_urls);

                        positionMap.set(i, position);


                        lodWorker.postMessage('add-checkpoint', {checkpoint: i, position})
                        resolve({position, number: i})
                    })
            });

            promiseArray.push(promise);
        }

        Promise.all(promiseArray).then(result => {

            if (params['File format'] === "JSON") {
                positionMap.forEach((position, checkpoint) => {
                    const urls = jsonUrlMap.get(checkpoint);
                    loadJsonUrlToTheScene(checkpoint, urls, position, scene)
                })
            }

            if (params['On-demand loading'] && params['File format'] === "glTF") {
                const loaded = new Set();
                setInterval(() => {
                    frustum.setFromProjectionMatrix(helperMat4.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse) );
    
                    positionMap.forEach((position, checkpoint) => {
                        if (frustum.containsPoint(position) &&
                            camera.position.distanceTo(position) < 800 &&
                            !loaded.has(checkpoint)) {
                                loaded.add(checkpoint);
    
                                if (params['Level-of-detail']) {
                                    loadUrlsToScene(checkpoint, position, true)
                                }
    
                                loadUrlsToScene(checkpoint, position, false)
                            }
                    })
                }, 500)
            } else if ( params['File format'] === "glTF" ){
    
                positionMap.forEach((position, checkpoint) => {
                    if (params['Level-of-detail']) {
                        loadUrlsToScene(checkpoint, position, true)
                    }
    
                    loadUrlsToScene(checkpoint, position, false)
                })
    
            }
    
    
            if (params['Level-of-detail']  && params['File format'] === "glTF") {
                setInterval(() => {
                    frustum.setFromProjectionMatrix(helperMat4.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse) );
    
                    positionMap.forEach((position, checkpoint) => {
                        if (frustum.containsPoint(position)) {

                                if (camera.position.distanceTo(position) > 150) {
                                    if (hasSimpleObject(checkpoint)) {
                                        getSimpleObject(checkpoint).visible = true;
                                    }
    
                                    if (hasFullObject(checkpoint)) {
                                        getFullObject(checkpoint).visible = false;
                                    }
    
                                } else if (isFullyLoaded(checkpoint)) {
                                    if (hasSimpleObject(checkpoint)) {
                                        getSimpleObject(checkpoint).visible = false;
                                    }
    
                                    if (hasFullObject(checkpoint)) {
                                        getFullObject(checkpoint).visible = true;
                                    }
                                }
                            }
                    })
                }, 500)
            }


            if (params['Active scene management']  && params['File format'] === "glTF") {

                setInterval(() => {
                    lodWorker.postMessage({
                        type: 'UPDATE',
                        pos: camera.position.toArray()
                    });
                }, 500)
        
        
                lodWorker.onmessage = ({ data }) => {
                    data.visible.forEach(uuid => getMesh(uuid).visible = true);
                    data.notVisible.forEach(uuid => getMesh(uuid).visible = false);
                };
            }

            highLevelAnimation(result);
        });
    }



    const loadUrlsToScene = (checkpoint, position, simple) => {
        const fullUrls = params['Multiple files'] ? multipleUrlMap.get(checkpoint) : fullUrlMap.get(checkpoint);
        const lowUrls = simpleUrlMap.get(checkpoint);

        const urls = simple ? lowUrls : fullUrls

        return loadGlTFUrlsToTheScene(checkpoint, urls, position, params, lodWorker, scene, simple);
    }


    const highLevelAnimation = (points) => {
        if (points.length === 0) {
            finish();
            return;
        }

        const checkpoint = points.shift();

        animateToCheckpoint(checkpoint.position, checkpoint.number, controls).then(() => highLevelAnimation(points));
    }


    const finish = () => {
        clearInterval(fpsIntervalId)
        console.log('RESULTS', results)
        console.log('EVENTS', getEvents())
        console.log('STATS', getStats())
        console.log('DECODE_STATS', getDecodeStats())

    }

    render();
}


init();