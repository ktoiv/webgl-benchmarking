
const fullyLoaded = new Set();
const firstLoaded = new Set();

const simpleObjects = new Map();
const fullObjects = new Map();

const meshMap = new Map();



const isFullyLoaded = checkpoint => fullyLoaded.has(checkpoint);
const markFullyLoaded = checkpoint => fullyLoaded.add(checkpoint);

const hasFirstLoaded = checkpoint => firstLoaded.has(checkpoint);
const setFirstLoaded = checkpoint => firstLoaded.add(checkpoint);

const addSimpleObject = (checkpoint, object) => simpleObjects.set(checkpoint, object);
const getSimpleObject = (checkpoint) => simpleObjects.get(checkpoint);
const hasSimpleObject = checkpoint => simpleObjects.has(checkpoint);


const addFullObject = (checkpoint, object) => fullObjects.set(checkpoint, object);
const getFullObject = (checkpoint) => fullObjects.get(checkpoint);
const hasFullObject = checkpoint => fullObjects.has(checkpoint);

const addMesh = (uuid, mesh) => meshMap.set(uuid, mesh);
const getMesh = uuid => meshMap.get(uuid); 



export { 
    isFullyLoaded,
    markFullyLoaded,
    hasFirstLoaded,
    setFirstLoaded,
    addSimpleObject,
    addFullObject,
    getSimpleObject,
    getFullObject,
    hasSimpleObject,
    hasFullObject,
    addMesh,
    getMesh
}