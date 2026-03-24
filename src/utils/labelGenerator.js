import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * SKAPAR DEN 2D-PROFIL SOM STICKAN HAR
 */
export function createLabelShape(width = 15, length = 150, radius = 3) {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const angle = 30 * Math.PI / 180;

    // Mathematically, the distance from the tip (0,0) to the "shoulder" center
    const tipLength = hw / Math.tan(angle);

    // 1. Start at the tip
    shape.moveTo(0, 0);

    // 2. Upper Slant
    // We go to the point where the slant meets the radius of the shoulder
    const slantLength = hw / Math.sin(angle);
    const stopDist = slantLength - (radius / Math.tan(angle / 2));
    shape.lineTo(Math.cos(angle) * stopDist, Math.sin(angle) * stopDist);

    // 3. The Upper Shoulder Arc
    shape.absarc(
        tipLength + (radius * Math.tan((Math.PI/2 - angle)/2)),
        hw - radius,
        radius,
        Math.PI - (Math.PI/2 - angle),
        Math.PI / 2,
        true // Changed from false to true to push the bulge OUT
    );

    // 4. Top straight edge
    shape.lineTo(length - radius, hw);

    // 5. Back Top Corner
    shape.absarc(length - radius, hw - radius, radius, Math.PI / 2, 0, true);

    // 6. Back edge
    shape.lineTo(length, -hw + radius);

    // 7. Back Bottom Corner
    shape.absarc(length - radius, -hw + radius, radius, 0, -Math.PI / 2, true);

    // 8. Bottom edge
    shape.lineTo(tipLength + (radius * Math.tan((Math.PI/2 - angle)/2)), -hw);

// 9. Lower Shoulder Arc
    shape.absarc(
        tipLength + (radius * Math.tan((Math.PI/2 - angle)/2)),
        -hw + radius,
        radius,
        -Math.PI / 2,
        -Math.PI + (Math.PI/2 - angle),
        true // Changed from false to true to push the bulge OUT
    );

    // 10. Back to tip
    shape.lineTo(0, 0);
    shape.closePath();

    // --- HOLE ---
    const holePath = new THREE.Path();
    holePath.absarc(14, 0, 2, 0, Math.PI * 2, false);
    shape.holes.push(holePath);

    return shape;
}

/**
 * BYGGER 3D-MODELLEN (STICKA + TEXT)
 */
export async function createLabelModel(plantName, latinName, width = 15, length = 150, thickness = 1.6, fontPath = 'fonts/roboto_bold.json', embossOnly = false) {
    // 1. Skapa stickan (The Body)
    const shape = createLabelShape(width, length, 3);
    shape.closePath();
    let bodyGeometry = new THREE.ExtrudeGeometry(shape, {
        depth: thickness,
        bevelEnabled: false,
        curveSegments: 12
    });

    bodyGeometry = BufferGeometryUtils.mergeVertices(bodyGeometry);
    bodyGeometry.computeVertexNormals();

    // Create the body mesh
    const bodyMesh = new THREE.Mesh(bodyGeometry, new THREE.MeshStandardMaterial({ color: 0x808080 }));
    bodyMesh.name = "LabelBody";

    // 2. Ladda font
    const loader = new FontLoader();
    const font = await new Promise((resolve, reject) => {
        loader.load(fontPath, resolve, undefined, reject);
    });

    // Internal helper to create "Baked" geometry (coordinates fixed in space)
    const createBakedTextGeometry = (text, size, x, y) => {
        const textDepth = embossOnly ? 0.25 : 1.05;
        const textZ = embossOnly ? thickness : thickness - 0.8;

        let geo = new TextGeometry(text, {
            font: font,
            size: size,
            depth: textDepth,
            curveSegments: 3,
            bevelEnabled: false
        });

        if (geo.attributes.uv) geo.deleteAttribute('uv');
        geo = BufferGeometryUtils.mergeVertices(geo);

        // Apply the transforms (Position and Rotation) directly to the vertices
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3(x, y, textZ);
        const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI));
        const scale = new THREE.Vector3(1, 1, 1);

        matrix.compose(position, rotation, scale);
        geo.applyMatrix4(matrix);

        return geo;
    };

    // Create the text geometries
    const padding = 2;
    const availableWidth = width - (padding * 2);
    const plantSize = Math.min(6, availableWidth * 0.6);
    const latinSize = plantSize * 0.65;
    const gap = 2;

    const textMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const textGroup = new THREE.Group();

    if (latinName && latinName.trim().length > 0) {
        // Both names present
        const startY = (width / 2) - padding;
        
        const latinGeo = createBakedTextGeometry(latinName, latinSize, length - 5, startY);
        latinGeo.computeVertexNormals();
        const latinMesh = new THREE.Mesh(latinGeo, textMaterial);
        latinMesh.name = latinName.replace(/\s+/g, '_');
        textGroup.add(latinMesh);

        const plantGeo = createBakedTextGeometry(plantName, plantSize, length - 5, startY - latinSize - gap);
        plantGeo.computeVertexNormals();
        const plantMesh = new THREE.Mesh(plantGeo, textMaterial);
        plantMesh.name = plantName.replace(/\s+/g, '_');
        textGroup.add(plantMesh);
    } else {
        // Only plant name present, center it vertically
        const startY = plantSize / 2;
        const plantGeo = createBakedTextGeometry(plantName, plantSize, length - 5, startY);
        plantGeo.computeVertexNormals();
        const plantMesh = new THREE.Mesh(plantGeo, textMaterial);
        plantMesh.name = plantName.replace(/\s+/g, '_');
        textGroup.add(plantMesh);
    }

    return { bodyMesh, textGroup };
}