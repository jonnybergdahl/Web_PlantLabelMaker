import * as THREE from 'three';
import JSZip from 'jszip';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Generates a basic 3MF file.
 * 3MF is a ZIP file containing:
 * - [Content_Types].xml
 * - _rels/.rels
 * - 3D/model.model
 */
export async function exportTo3MF(bodyMesh, textGroup, filename = 'plant_label.3mf') {
    const zip = new JSZip();

    // 1. [Content_Types].xml
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
    zip.file('[Content_Types].xml', contentTypes);

    // 2. _rels/.rels
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/model.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
    zip.file('_rels/.rels', rels);

    // 3. 3D/model.model
    // We need to convert the meshes to vertices and triangles
    const modelXml = await generateModelXml(bodyMesh, textGroup);
    zip.file('3D/model.model', modelXml);

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

async function generateModelXml(bodyMesh, textGroup) {
    // Vi mappar om axlarna manuellt:
    // Three.js X -> Slicer X
    // Three.js Y -> Slicer Y
    // Three.js Z -> Slicer Z (Höjd)

    const bodyGeo = bodyMesh.geometry.clone();

    // Vi ser till att texten är sammanslagen och har sina världs-koordinater
    const geometries = [];
    textGroup.updateMatrixWorld(true);
    textGroup.traverse(child => {
        if (child.isMesh) {
            let geo = child.geometry.clone();
            child.updateMatrixWorld();
            geo.applyMatrix4(child.matrixWorld);
            geometries.push(geo);
        }
    });

    let combinedTextGeo = BufferGeometryUtils.mergeGeometries(geometries, false);
    combinedTextGeo = BufferGeometryUtils.mergeVertices(combinedTextGeo);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
    <m:colorgroup id="1">
      <m:color color="#808080FF" />
      <m:color color="#FFFFFFFF" />
    </m:colorgroup>
    <object id="3" type="model">
      ${meshToXml(bodyGeo, 0)}
    </object>
    <object id="4" type="model">
      ${meshToXml(combinedTextGeo, 1)}
    </object>
  </resources>
  <build>
    <item objectid="3" />
    <item objectid="4" />
  </build>
</model>`;

    bodyGeo.dispose();
    combinedTextGeo.dispose();
    geometries.forEach(g => g.dispose());
    return xml;
}

function meshToXml(geometry, colorIndex) {
    const attr = geometry.attributes.position;
    const indices = geometry.index ? geometry.index.array : null;

    let verticesXml = '      <vertices>\n';
    for (let i = 0; i < attr.count; i++) {
        verticesXml += `        <vertex x="${attr.getX(i).toFixed(4)}" y="${attr.getY(i).toFixed(4)}" z="${attr.getZ(i).toFixed(4)}" />\n`;
    }
    verticesXml += '      </vertices>\n';

    let trianglesXml = '      <triangles>\n';
    if (indices) {
        for (let i = 0; i < indices.length; i += 3) {
            trianglesXml += `        <triangle v1="${indices[i]}" v2="${indices[i+1]}" v3="${indices[i+2]}" pid="1" p1="${colorIndex}" />\n`;
        }
    } else {
        // Fixad fallback om index saknas
        for (let i = 0; i < attr.count; i += 3) {
            trianglesXml += `        <triangle v1="${i}" v2="${i+1}" v3="${i+2}" pid="1" p1="${colorIndex}" />\n`;
        }
    }
    trianglesXml += '      </triangles>\n';

    return `<mesh>\n${verticesXml}${trianglesXml}      </mesh>`;
}

async function groupToXml(group, colorIndex) {
    const geometries = [];

    // Tvinga gruppen att räkna ut alla sina barns positioner/rotationer
    group.updateMatrixWorld(true);

    group.traverse(child => {
        if (child.isMesh) {
            // Skapa en kopia av geometrin
            let geo = child.geometry.clone();

            // VIKTIGT: Applicera mesh-transformationen (position + rotation + skala)
            // direkt på geometrins hörn innan vi mergar.
            child.updateMatrixWorld();
            geo.applyMatrix4(child.matrixWorld);

            // Rensa skräp som kan störa 3MF
            if (geo.attributes.uv) geo.deleteAttribute('uv');
            if (geo.attributes.normal) geo.deleteAttribute('normal');

            geometries.push(geo);
        }
    });

    if (geometries.length === 0) return '';

    // Slå ihop alla transformerade bokstäver
    let combinedGeometry = BufferGeometryUtils.mergeGeometries(geometries, false);
    combinedGeometry = BufferGeometryUtils.mergeVertices(combinedGeometry);
    combinedGeometry.computeVertexNormals();

    const meshXml = meshToXml(combinedGeometry, colorIndex);

    geometries.forEach(g => g.dispose());
    combinedGeometry.dispose();

    return meshXml;
}