
const startTime = new Map();
const firstLoadedTime = new Map();
const fullyLoadedTime = new Map();

const startDecodedTime = new Map();
const fullyDecodedTime = new Map();


const events = [];
const stats = [];
const decodestats = [];

let benchmarkStart;

const setStartTime = checkpoint => {
    const time = Date.now();
    startTime.set(checkpoint, time);

    const event = {
        TIME: (time - benchmarkStart) / 1000,
        NAME: `Checkpoint ${checkpoint} start`
    }
    
    events.push(event);
}

const setFirstLoadedTime = checkpoint => {
    const time = Date.now();
    firstLoadedTime.set(checkpoint, time);

    const event = {
        TIME: (time - benchmarkStart) / 1000,
        NAME: `Checkpoint ${checkpoint} first load`
    }
    
    events.push(event);
}

const setFullyLoadedTime = checkpoint => {
    const time = Date.now();
    fullyLoadedTime.set(checkpoint, time);

    let timeToFirst = 0;
    let timeToFull = 0;

    if (startTime.has(checkpoint)) {

        if (firstLoadedTime.has(checkpoint)) {
            timeToFirst = (firstLoadedTime.get(checkpoint) - startTime.get(checkpoint)) / 1000;
        }

        timeToFull = (fullyLoadedTime.get(checkpoint) - startTime.get(checkpoint)) / 1000;
    }

    const event = {
        TIME: (time - benchmarkStart) / 1000,
        NAME: `Checkpoint ${checkpoint} full load`
    }
    
    events.push(event);

    const stat = {
        checkpoint,
        timeToFirst,
        timeToFull
    }

    stats.push(stat);
    
    console.group("Checkpoint " + checkpoint);
    console.log('Time it took to show anything:', timeToFirst, 'seconds');
    console.log('Time it took to show everything:', timeToFull, 'seconds');
    console.groupEnd();
}


const createMeshAddEvent = () => {

    if (!benchmarkStart) return;

    const time = Date.now();
    const eventTime = time - benchmarkStart 

    const event = {
        TIME: eventTime / 1000,
        NAME: `Add mesh`
    }

    events.push(event);
}

const setStartDecodedTime = checkpoint => {

    if (startDecodedTime.has(checkpoint)) return;

    const time = Date.now();
    startDecodedTime.set(checkpoint, time);

    const event = {
        TIME: (time - benchmarkStart) / 1000,
        NAME: `Checkpoint ${checkpoint} start decode`
    }
    
    events.push(event);
}

const setFullyDecodedTime = checkpoint => {
    const time = Date.now();
    fullyDecodedTime.set(checkpoint, time);

    let timeToFull = 0;

    if (startDecodedTime.has(checkpoint)) {

        timeToFull = (fullyDecodedTime.get(checkpoint) - startDecodedTime.get(checkpoint)) / 1000;
    }

    const event = {
        TIME: (time - benchmarkStart) / 1000,
        NAME: `Checkpoint ${checkpoint} full decoded`
    }
    
    events.push(event);

    const stat = {
        checkpoint,
        timeToFull
    }

    decodestats.push(stat);
    
    console.group("Checkpoint " + checkpoint);
    console.log('Time it took to decode everything:', timeToFull, 'seconds');
    console.groupEnd();
}




const getEvents = () => events;
const getStats = () => stats;
const getDecodeStats = () => decodestats;



export {
    getStats,
    getEvents,
    benchmarkStart,
    setStartTime,
    setFirstLoadedTime,
    setFullyLoadedTime,
    setStartDecodedTime,
    setFullyDecodedTime,
    getDecodeStats,
    createMeshAddEvent
}

