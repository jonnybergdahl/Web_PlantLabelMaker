import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import JSZip from 'jszip';

/**
 * Downloads a blob.
 */
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Main export function for STL.
 * Exports body and text as separate binary STL files bundled in a single ZIP.
 * Slicers like PrusaSlicer and Bambu Studio can then import them together
 * to treat them as separate parts for multicolor printing.
 */
export async function exportToSTL(bodyMesh, textGroup, filename = 'plant_label.stl') {
    const exporter = new STLExporter();
    const zip = new JSZip();
    
    // 1. Export Body
    const bodyResult = exporter.parse(bodyMesh, { binary: true });
    const bodyFilename = filename.replace('.stl', '_body.stl');
    // JSZip handles ArrayBuffer, but exporter.parse(..., { binary: true }) returns a DataView.
    // We need to pass the underlying buffer.
    zip.file(bodyFilename, bodyResult.buffer);

    // 2. Export Text
    const textResult = exporter.parse(textGroup, { binary: true });
    const textFilename = filename.replace('.stl', '_text.stl');
    zip.file(textFilename, textResult.buffer);

    try {
        // Generate the ZIP blob
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const zipFilename = filename.replace('.stl', '.zip');
        
        // Trigger the ZIP download
        downloadBlob(zipBlob, zipFilename);
    } catch (error) {
        console.error('Error exporting to STL (ZIP):', error);
    }
}
