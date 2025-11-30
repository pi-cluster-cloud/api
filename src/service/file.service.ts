import config from 'config';
import prisma from '../utils/prisma';
import { Prisma, File } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

/**
 * Saves a file to the local machine and creates a database record
 * 
 * @async
 * @param {number} userId - The ID of the user uploading the file
 * @param {Express.Multer.File} file - The uploaded file from multer
 * @returns {Promise<File>} - Created file record
 * 
 * @throws {Error} - If file system operations fail
 */
export async function saveFile(
    userId: number,
    file: Express.Multer.File
): Promise<File> {
    const baseDir: string = config.get<string>('fileStorage.saveDirectory');
    const userDir: string = path.join(baseDir, userId.toString());
    
    // Ensure user directory exists
    await fs.mkdir(userDir, { recursive: true });
    
    // Define file path
    const filePath: string = path.join(userDir, file.originalname);
    
    // Write file to disk
    await fs.writeFile(filePath, file.buffer);
    
    // Create database record
    const fileRecord: File = await prisma.file.create({
        data: {
            fileName: file.originalname,
            mimeType: file.mimetype,
            size: BigInt(file.size),
            path: filePath,
            user: userId
        }
    });
    
    return fileRecord;
}

/**
 * Gets all files for a given user
 * 
 * @async
 * @param {number} userId - The ID of the user
 * @returns {Promise<File[]>} - Array of user's files
 */
export async function getFilesByUserId(userId: number): Promise<File[]> {
    const files: File[] = await prisma.file.findMany({
        where: { user: userId }
    });
    
    return files;
}

/**
 * Gets a file by its ID
 * 
 * @async
 * @param {number} fileId - The ID of the file
 * @returns {Promise<File | null>} - The found file or null if not found
 */
export async function getFileById(fileId: number): Promise<File | null> {
    const file: File | null = await prisma.file.findUnique({
        where: { id: fileId }
    });
    
    return file;
}

/**
 * Finds all files matching given properties
 * 
 * @async
 * @param {Prisma.FileWhereInput} where - Properties to search for
 * @returns {Promise<File[]>} - Found files matching criteria
 */
export async function findFiles(
    where: Prisma.FileWhereInput
): Promise<File[]> {
    const files: File[] = await prisma.file.findMany({
        where
    });
    
    return files;
}

/**
 * Reads a file from disk
 * 
 * @async
 * @param {string} filePath - The path to the file on disk
 * @returns {Promise<Buffer>} - The file contents as a buffer
 * 
 * @throws {Error} - If file cannot be read
 */
export async function readFile(filePath: string): Promise<Buffer> {
    const fileBuffer: Buffer = await fs.readFile(filePath);
    return fileBuffer;
}

/**
 * Deletes a file from disk and database
 * 
 * @async
 * @param {number} fileId - The ID of the file to delete
 * @returns {Promise<File>} - The deleted file record
 * 
 * @throws {Error} - If file doesn't exist or deletion fails
 */
export async function deleteFile(fileId: number): Promise<File> {
    const file: File | null = await getFileById(fileId);
    
    if (!file) {
        throw new Error('File not found');
    }
    
    // Delete from disk
    await fs.unlink(file.path);
    
    // Delete from database
    const deletedFile: File = await prisma.file.delete({
        where: { id: fileId }
    });
    
    return deletedFile;
}