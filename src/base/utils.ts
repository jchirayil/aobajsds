//src/utils.ts
import fs from 'fs';
import pr from 'path';
import JSZip from 'jszip';

/**
 * Calculates the CRC-32 checksum of a string.
 * @param str The input string.
 * @param reversedPolynomial The reversed polynomial to use for the CRC calculation (default: 0x04C11DB7).
 * @returns The CRC-32 checksum as a number.
 */
export function crc(str: string, reversedPolynomial: number = 0x04c11db7): number {
    /**
     * Generates the CRC-32 lookup table.
     * @param reversedPolynomial The reversed polynomial.
     * @returns The CRC-32 lookup table (an array of 256 numbers).
     */
    function generateTable(reversedPolynomial: number): number[] {
        const table: number[] = [];
        let n: number = 0;
        for (let i = 0; i < 256; i++) {
            n = i;
            for (let j = 8; j > 0; j--) {
                if ((n & 1) === 1) {
                    n = (n >>> 1) ^ reversedPolynomial;
                } else {
                    n = n >>> 1;
                }
            }
            table[i] = n;
        }
        return table;
    }

    /**
     * Initializes the CRC value.
     * @returns The initial CRC value (0xFFFFFFFF).
     */
    function initializeCrc(): number {
        return 0xffffffff;
    }

    /**
     * Adds a byte to the CRC calculation using the lookup table.
     * @param table The CRC-32 lookup table.
     * @param crc The current CRC value.
     * @param byte The byte to add (as a number).
     * @returns The updated CRC value.
     */
    function addByteToCrc(table: number[], crc: number, byte: number): number {
        crc = (crc >>> 8) ^ table[byte ^ (crc & 0x000000ff)];
        return crc;
    }

    /**
     * Finalizes the CRC value.
     * @param crc The final CRC value.
     * @returns The processed CRC value.
     */
    function finalizeCrc(crc: number): number {
        crc = ~crc;
        crc = crc < 0 ? 0xffffffff + crc + 1 : crc;
        return crc;
    }

    const table = generateTable(reversedPolynomial);
    let currentCrc = initializeCrc();
    for (let i = 0; i < str.length; i++) {
        currentCrc = addByteToCrc(table, currentCrc, str.charCodeAt(i));
    }
    currentCrc = finalizeCrc(currentCrc);
    return currentCrc;
}

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
        let fileContent: string = '';
        //(async () => {
        //    fileContent = await readGZFile(fileName);
        //})().then(() => {
            //console.log('readGZFile fileContent', fileContent);
        //    return JSON.parse(fileContent);
        //});
        //return new Promise((resolve) => {
        //    readGZFile(fileName)
        //        .then((fileContent) => {
        //            resolve(JSON.parse(fileContent));
        //        })
        //        .catch((err) => {
        //            console.error('Error reading GZ file:', err);
        //            throw err;
        //        });
        //});
        //const awaiting = temp(fileName);
        //awaiting.then((fileContent) => {
        //    console.log('readGZFile fileContent', fileContent);
        //    return JSON.parse(fileContent);
        //});
        //return temp(fileName);
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
