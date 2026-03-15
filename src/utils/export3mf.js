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
    // Clone and merge vertices to avoid open edges
    let bodyGeometry = bodyMesh.geometry.clone();
    
    // Final cleaning step for body geometry
    if (bodyGeometry.attributes.uv) bodyGeometry.deleteAttribute('uv');
    if (bodyGeometry.attributes.normal) bodyGeometry.deleteAttribute('normal');
    bodyGeometry = BufferGeometryUtils.mergeVertices(bodyGeometry);
    bodyGeometry.computeVertexNormals();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <resources>
    <m:colorgroup id="1">
      <m:color color="#808080FF" /> <!-- Gray -->
      <m:color color="#FFFFFFFF" /> <!-- White -->
    </m:colorgroup>
    <object id="3" type="model">
      ${meshToXml(bodyGeometry, 0)}
    </object>
    <object id="4" type="model">
      ${await groupToXml(textGroup, 1)}
    </object>
  </resources>
  <build>
    <item objectid="3" />
    <item objectid="4" />
  </build>
</model>`;
    
    // Clean up temporary geometries
    bodyGeometry.dispose();
    
    return xml;
}

function meshToXml(geometry, colorIndex) {
    const vertices = geometry.attributes.position.array;
    const indices = geometry.index ? geometry.index.array : null;
    
    let verticesXml = '      <vertices>\n';
    for (let i = 0; i < vertices.length; i += 3) {
        verticesXml += `        <vertex x="${vertices[i].toFixed(4)}" y="${vertices[i+1].toFixed(4)}" z="${vertices[i+2].toFixed(4)}" />\n`;
    }
    verticesXml += '      </vertices>\n';
    
    let trianglesXml = '      <triangles>\n';
    if (indices) {
        for (let i = 0; i < indices.length; i += 3) {
            trianglesXml += `        <triangle v1="${indices[i]}" v2="${indices[i+1]}" v3="${indices[i+2]}" pid="1" p1="${colorIndex}" />\n`;
        }
    } else {
        for (let i = 0; i < vertices.length / 3; i += 3) {
            trianglesXml += `        <triangle v1="${i}" v2="${i+1}" v3="${i+2}" pid="1" p1="${colorIndex}" />\n`;
        }
    }
    trianglesXml += '      </triangles>\n';
    
    return `<mesh>\n${verticesXml}${trianglesXml}      </mesh>`;
}

async function groupToXml(group, colorIndex) {
    const geometries = [];

    group.traverse(child => {
        if (child.isMesh) {
            let geo = child.geometry.clone();
            
            // Strip away unnecessary data
            if (geo.attributes.uv) geo.deleteAttribute('uv');
            if (geo.attributes.normal) geo.deleteAttribute('normal');
            
            // Weld vertices and recompute normals before any transformations
            geo = BufferGeometryUtils.mergeVertices(geo);
            geo.computeVertexNormals();
            
            // Apply mesh transform to vertices
            child.updateMatrixWorld();
            geo.applyMatrix4(child.matrixWorld);
            
            geometries.push(geo);
        }
    });

    if (geometries.length === 0) return '';

    // Merge all geometries into one
    let combinedGeometry = BufferGeometryUtils.mergeGeometries(geometries, false);
    
    // Final cleaning step on the combined mesh
    combinedGeometry = BufferGeometryUtils.mergeVertices(combinedGeometry);
    combinedGeometry.computeVertexNormals();

    const meshXml = meshToXml(combinedGeometry, colorIndex);

    // Clean up temporary geometries
    geometries.forEach(g => g.dispose());
    combinedGeometry.dispose();

    return meshXml;
}
