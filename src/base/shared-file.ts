//src/shared-file.ts
import fs from 'fs';
import pr from 'path';
import JSZip from 'jszip';

/**
 * Reads and parses a JSON file. Supports both standard JSON files and compressed `.gz` files.
 * @param fileName The path to the file.
 * @returns A promise that resolves to the parsed JSON object.
 */
export async function readJSON(fileName: string): Promise<any> {
    const extension = pr.extname(fileName).toLowerCase();

    if (extension === '.gz') {
        // Delegate `.gz` file handling to the sub-function
        return JSON.parse(await readGZFile(fileName));
    } else if (extension === '.json') {
        // Handle standard JSON files
        return JSON.parse(fs.readFileSync(fileName, 'utf-8'));
    } else {
        throw new Error(`Unsupported file extension: ${extension}`);
    }
}

async function readGZFile(fileName: string): Promise<any> {
    const parsedPath = pr.parse(fileName); // Parse the file path
    const zip = new JSZip(); // Create a new JSZip instance
    const zipData = await zip.loadAsync(fs.readFileSync(fileName)); // Load the ZIP file
    const zipFile = zipData.file(parsedPath.name); // Get the file inside the ZIP by name

    if (!zipFile) {
        throw new Error(`File ${parsedPath.name} not found in the ZIP archive.`);
    }

    const fileContent = await zipFile.async('string'); // Extract the file content as a string
    return fileContent;
}
