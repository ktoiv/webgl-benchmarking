import * as WebIFC from 'web-ifc';
import fs from 'fs';

import {BufferGeometry, BufferAttribute, Mesh, Group, Color, DoubleSide, MeshStandardMaterial, Matrix4, Vector3, MeshBasicMaterial} from "three";
import { GLTFExporter } from './export/GLTFExporter';
import {Blob, FileReader} from 'vblob';
import {Canvas} from 'canvas';

//@ts-ignore
global.Blob = Blob;
//@ts-ignore
global.FileReader = FileReader
//@ts-ignore
global.document = {
    //@ts-ignore
    createElement: (_: string) => {

        return new Canvas(256,256);
    }
}

const FILE_PATH: string = './input.ifc';
const EXPORTER: GLTFExporter = new GLTFExporter();
const SINGLE_MESH_THRESHOLD: number = 20000;

interface RawTriangleMesh {
    vertices: Float32Array;
    indices: Uint32Array;
    color: number[],
    transformation: number[]
}

interface GeometryStats {
    size: number;
    geometry: BufferGeometry;
    color: Color,
    matrix: Matrix4;
}

const run = async () => {
    const ifcData = fs.readFileSync(FILE_PATH);

    const ifcApi: WebIFC.IfcAPI = new WebIFC.IfcAPI();
   // ifcApi.SetWasmPath("./node_modules/web-ifc/");
    
    await ifcApi.Init();

    let info = {
        rawFileData: new Uint8Array(ifcData)
    };

    let modelID = ifcApi.OpenModel(info.rawFileData);
    
    const dividedMeshes: RawTriangleMesh[][] = []; 
    let meshes: RawTriangleMesh[] = [];
    let interminMeshes: RawTriangleMesh[] = [];
    let cumulatedFaces: number = 0;


    ifcApi.StreamAllMeshes(modelID, (mesh: WebIFC.FlatMesh) => {

        const placedGeometries = mesh.geometries;

        for (let i = 0; i < placedGeometries.size(); i++) {

            const placedGeometry = placedGeometries.get(i);
            let id = 1;

            const transformation = placedGeometry.flatTransformation;
            const geom = ifcApi.GetGeometry(modelID, placedGeometry.geometryExpressID);
            const vertices = ifcApi.GetVertexArray(geom.GetVertexData(), geom.GetVertexDataSize());
            const indices = ifcApi.GetIndexArray(geom.GetIndexData(), geom.GetIndexDataSize());
            const color = [placedGeometry.color.x, placedGeometry.color.y, placedGeometry.color.z];
            meshes.push({vertices, indices, color, transformation})
            interminMeshes.push({vertices, indices, color, transformation})
            
            cumulatedFaces += indices.length / 3;

            if (cumulatedFaces >= SINGLE_MESH_THRESHOLD) {
                dividedMeshes.push(interminMeshes);
                id++;
                cumulatedFaces = 0;
                interminMeshes = [];
            }
        }

    });


    dividedMeshes.forEach((subMeshes, i) => {
        turnFileIntoGLTF(subMeshes, i);
    })

    turnFileIntoGLTF(meshes)
    turnFileIntoSimplifiedGLTF(meshes);
    turnFileIntoJSON(meshes);

    ifcApi.CloseModel(modelID);
};



const turnFileIntoJSON = (meshes: RawTriangleMesh[]) => {
    fs.writeFileSync('data/output.json', JSON.stringify(meshes));
}

const getGeometryFromIFCMesh = (mesh: RawTriangleMesh): BufferGeometry => {
    const geometry: BufferGeometry = new BufferGeometry();

    const posFloats = new Float32Array(mesh.vertices.length / 2) ;
    const normFloats = new Float32Array(mesh.vertices.length / 2);


    for (let i = 0; i < mesh.vertices.length; i += 6) {

            posFloats[i / 2] = mesh.vertices[i];
            posFloats[i / 2 + 1] = mesh.vertices[i + 1];
            posFloats[i / 2 + 2] = mesh.vertices[i + 2];

            normFloats[i / 2] = mesh.vertices[i + 3];
            normFloats[i / 2 + 1 ] = mesh.vertices[i + 4];
            normFloats[i / 2 + 2] = mesh.vertices[i + 5];
        
    }

    geometry.setAttribute('position', new BufferAttribute(posFloats, 3));
    geometry.setAttribute('normal', new BufferAttribute(normFloats, 3));
    geometry.setIndex(new BufferAttribute(mesh.indices, 1));

    geometry.computeBoundingBox();

    return geometry;
}

const turnFileIntoGLTF = (meshes: RawTriangleMesh[], id?: number) => {

    console.log('received', meshes.length, 'meshes')
    const helperMatrix: Matrix4 = new Matrix4();

    const parentObject: Group  = new Group();

    
    meshes.forEach(mesh => {

        const geometry = getGeometryFromIFCMesh(mesh);
        const mat = new MeshStandardMaterial({
            color: new Color(mesh.color[0], mesh.color[1],mesh.color[2]),
            side: DoubleSide
        });

        helperMatrix.fromArray(mesh.transformation);
        const threeMesh = new Mesh(geometry, mat)

        threeMesh.matrix = helperMatrix.clone();
        threeMesh.matrixAutoUpdate = false;

        parentObject.add(threeMesh);
    });

    let actualId = id ? `-${id}` : '';

    EXPORTER.parse(parentObject, (gltf: any) => {
        fs.writeFileSync(`data/output${actualId}.gltf`, JSON.stringify(gltf));
    }, (error: any) => {
        console.error('',error.message)
    }, {});
}

const turnFileIntoSimplifiedGLTF = (meshes: RawTriangleMesh[], id?: number) => {

    console.log('received', meshes.length, 'meshes')
    const helperMatrix: Matrix4 = new Matrix4();
    const _v3 = new Vector3();

    const parentObject: Group  = new Group();

    const geometryStats: GeometryStats[] = meshes.map(mesh =>{
        const geometry = getGeometryFromIFCMesh(mesh);
        geometry.computeBoundingBox();
        const size = geometry.boundingBox?.getSize(_v3).length()!;
        const color = new Color(mesh.color[0], mesh.color[2],mesh.color[2])
        helperMatrix.fromArray(mesh.transformation);

        return {color, geometry, size, matrix: helperMatrix.clone()};
    });


    geometryStats.sort((a, b) => b.size - a.size);

    const biggestSize = geometryStats[0].size;

    const includedGeoms = geometryStats.filter(stats => stats.size / biggestSize > 0.2);

    includedGeoms.forEach( geometryStats => {

        const geom = geometryStats.geometry;

        const mat = new MeshBasicMaterial({
            color: geometryStats.color,
            side: DoubleSide,
        });

        const threeMesh = new Mesh(geom, mat)
        threeMesh.matrix = geometryStats.matrix.clone();
        threeMesh.matrixAutoUpdate = false;

        parentObject.add(threeMesh);
    });

    EXPORTER.parse(parentObject, (gltf: any) => {
        fs.writeFileSync(`data/output-simple.gltf`, JSON.stringify(gltf));
    }, (error: any) => {
        console.error('',error.message)
    }, {});
}

run();
