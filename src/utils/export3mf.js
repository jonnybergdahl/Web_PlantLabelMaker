import * as THREE from 'three';
import { exportTo3MF as exporter } from 'three-3mf-exporter';

export async function exportTo3MF(bodyMesh, textGroup, filename = 'plant_label.3mf') {
    const exportGroup = new THREE.Group();

    // 1. Create the two "Master" materials
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x808080, name: 'Material1' });
    const textMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, name: 'Material2' });

    // 2. Process the Body
    bodyMesh.updateMatrixWorld(true);
    const bodyClone = new THREE.Mesh(bodyMesh.geometry.clone(), bodyMat);
    bodyClone.geometry.applyMatrix4(bodyMesh.matrixWorld);
    bodyClone.name = "LabelBody";
    exportGroup.add(bodyClone);

    // 3. Process ALL Text Meshes
    textGroup.updateMatrixWorld(true);
    textGroup.traverse((child) => {
        if (child.isMesh) {
            // We use the EXACT same textMat reference for every child
            const textClone = new THREE.Mesh(child.geometry.clone(), textMat);

            // Critical: Ensure the child's specific world position is captured
            child.updateMatrixWorld(true);
            textClone.geometry.applyMatrix4(child.matrixWorld);

            // Give them the same name prefix so the slicer might group them
            textClone.name = "Text_" + (child.name || "Part");

            exportGroup.add(textClone);
        }
    });

    try {
        // By passing a flat group where all text meshes share 'textMat',
        // the 3MF exporter should only write two <material> entries in the XML.
        const blob = await exporter(exportGroup);

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('3MF Export Error:', error);
    }
}