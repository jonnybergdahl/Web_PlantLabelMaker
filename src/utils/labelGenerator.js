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

    // Vinkeln för spetsen är 30 grader mot centrumlinjen (totalt 60)
    const angle = 30 * Math.PI / 180;

    // För att rundningen ska tangera både den vinklade linjen och den raka
    // behöver vi förskjuta startpunkten för rundningen.
    const offset = radius * Math.tan((Math.PI / 2 - angle) / 2);
    const tipLength = hw / Math.tan(angle);

    // --- ÖVERKONTUR ---
    shape.moveTo(0, 0); // Start i spetsen

    // Dra linjen mot axeln, men stanna innan hörnet så vi kan runda
    const shoulderX = tipLength;
    shape.lineTo(shoulderX - (radius * Math.sin(angle)), hw - (radius * (1 - Math.cos(angle))));

    // Runda av axeln (övergång spets -> rak del)
    // Vi använder arc för att skapa en mjuk sväng
    shape.absarc(shoulderX + offset, hw - radius, radius, Math.PI - (Math.PI/2 - angle), Math.PI / 2, true);

    // Rak långsida fram till toppen
    shape.lineTo(length - radius, hw);

    // Runda av toppen (hörnet)
    shape.absarc(length - radius, hw - radius, radius, Math.PI / 2, 0, true);

    // --- UNDERKONTUR ---
    // Kortsidan i toppen
    shape.lineTo(length, -hw + radius);

    // Runda av andra hörnet i toppen
    shape.absarc(length - radius, -hw + radius, radius, 0, -Math.PI / 2, true);

    // Rak långsida tillbaka mot spetsen
    shape.lineTo(shoulderX + offset, -hw);

    // Runda av axeln på undersidan
    shape.absarc(shoulderX + offset, -hw + radius, radius, -Math.PI / 2, -Math.PI + (Math.PI/2 - angle), true);

    // Gå tillbaka till spetsen
    shape.lineTo(0, 0);

    // --- HÅLET ---
    const holeRadius = 2; // Lite mindre för att rymmas snyggt
    const holePath = new THREE.Path();
    const holeX = 14;
    holePath.absarc(holeX, 0, holeRadius, 0, Math.PI * 2, true);
    shape.holes.push(holePath);

    return shape;
}

/**
 * BYGGER 3D-MODELLEN (STICKA + TEXT)
 */
export async function createLabelModel(plantName, latinName, width = 15, length = 150, thickness = 1.6, fontPath = 'fonts/roboto_bold.json') {
    // 1. Skapa stickan
    const shape = createLabelShape(width, length, 3);
    let bodyGeometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
    
    // Förbättra geometri genom att slå samman hörn för smidigare kanter och bättre 3MF-export
    bodyGeometry = BufferGeometryUtils.mergeVertices(bodyGeometry);
    bodyGeometry.computeVertexNormals();
    
    const bodyMesh = new THREE.Mesh(bodyGeometry, new THREE.MeshStandardMaterial({ color: 0x808080 }));

    // 2. Ladda font
    const loader = new FontLoader();
    const font = await new Promise((resolve, reject) => {
        console.log("Loading font:", fontPath);
        loader.load(fontPath, resolve, undefined, reject);
    });

    const textGroup = new THREE.Group();
    const textMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

    // Hjälpfunktion för att skapa text
    const createCorrectText = (text, size, x, y) => {
        let geo = new TextGeometry(text, {
            font: font,
            size: size,
            depth: 1.0, // Text should be 1mm thick in Z
            curveSegments: 3, // Reduces triangle count and prevents self-intersections
            bevelEnabled: false
        });

        // Strip away unnecessary data that often corrupts 3MF exports
        if (geo.attributes.uv) geo.deleteAttribute('uv');
        if (geo.attributes.normal) geo.deleteAttribute('normal');

        // Clean geometry before creating mesh
        geo = BufferGeometryUtils.mergeVertices(geo);
        geo.computeVertexNormals();
        geo.computeBoundingBox();

        const mesh = new THREE.Mesh(geo, textMaterial);
        // Start text at Z = thickness - 0.8 (submerged 0.8mm into stake), ending at Z = thickness + 0.2 (0.2mm protrusion)
        mesh.position.set(x, y, thickness - 0.8);
        mesh.rotation.z = Math.PI;

        // Ensure the geometry is mathematically sound after all transformations (not strictly required on the geo itself if we use mesh transforms, but done for robustness)
        mesh.updateMatrixWorld();
        
        return mesh;
    };

    // Text configuration
    const padding = 2;
    const availableWidth = width - (padding * 2);
    
    const plantSize = Math.min(6, availableWidth * 0.6); // Slightly bigger
    const latinSize = plantSize * 0.65;
    const gap = 2;

    // "Left aligned" means they should start at the same X (which is length-5, the rounded end).
    // The text runs "down the stick" from X=150 towards X=0.
    // Due to mesh.rotation.z = Math.PI, the characters are rotated 180 degrees.
    // This makes the text read correctly top-to-bottom if you hold the label vertically (rounded end up),
    // but the local Y (letter height) maps to -world Y.
    // To ensure "Plant Name" is ABOVE "Latin Name" in this orientation, we swap their local Y positions.
    const startY = (width / 2) - padding;

    // Latin name is placed at the "top" of the local coordinate system (which becomes the bottom visually).
    const latinMesh = createCorrectText(latinName, latinSize, length - 5, startY);
    // Plant name is placed below it (which becomes the top visually).
    const plantMesh = createCorrectText(plantName, plantSize, length - 5, startY - latinSize - gap);

    textGroup.add(plantMesh);
    textGroup.add(latinMesh);

    return { bodyMesh, textGroup };
}