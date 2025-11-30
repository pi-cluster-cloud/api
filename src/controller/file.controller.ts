import { Response, Request } from 'express';
import { saveFile, getFileById, getFilesByUserId, readFile, deleteFile, findFiles } from '../service/file.service';
import { Prisma, File } from '@prisma/client';
import { TypedRequest } from '../utils/typed_request';
import { GetFileInput, GetUserFilesInput, DeleteFileInput } from '../schema/file.schema';
import { omit } from 'lodash';

/**
 * Handles the upload of a new file
 *
 * @async
 * @function uploadFileHandler
 * @param {Request} req - Request containing file from multer middleware
 * @param {Response} res - Response to be sent
 * @returns {Promise<Response>} Returns an HTTP response:
 * - `201` with the newly created file record on success
 * - `400` if no file is uploaded
 * - `409` if file with same name already exists
 * - `500` for file system or database errors
 */
export async function uploadFileHandler(
    req: Request,
    res: Response
): Promise<Response> {
    try {
        // No file sent
        if (!req.file) {
            return res.status(400).send({
                message: 'File is required'
            });
        }

        const userId: number = res.locals.user.id;
        
        // Check if user already has a file with this name
        const existingFiles: File[] = await findFiles({
            user: userId,
            fileName: req.file.originalname
        });

        if (existingFiles.length) {
            return res.status(409).send({
                message: 'File with this name already exists'
            });
        }

        const file: File = await saveFile(userId, req.file);

        return res.status(201).send({
            message: 'File uploaded successfully',
            file: omit(file, 'path', 'user', 'size')
        });
    }
    catch (err: unknown) {
        console.log(err);
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            return res.status(400).send({
                message: 'Database error occurred'
            });
        }

        return res.status(500).send({
            message: 'Internal server error occurred'
        });
    }
}

/**
 * Handles downloading a file by fileId
 * 
 * @async
 * @function downloadFileHandler
 * @param {TypedRequest<GetFileInput>} req - Request containing validated fileId in params
 * @param {Response} res - Response to be sent
 * @returns {Promise<Response>} Returns an HTTP response:
 * - `200` with file contents as download
 * - `404` if file is not found
 * - `403` if user doesn't own the file
 * - `500` for file system or database errors
 */
export async function downloadFileHandler(
    req: TypedRequest<GetFileInput>,
    res: Response
): Promise<Response | void> {
    try {
        const fileId: number = Number(req.params.fileId);
        const file: File | null = await getFileById(fileId);

        if (!file) {
            return res.status(404).send({
                message: 'File not found'
            });
        }

        if (file.user !== res.locals.user.id) {
            return res.status(403).send({
                message: 'You do not have permission to access this file'
            });
        }

        const fileBuffer: Buffer = await readFile(file.path);

        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
        return res.send(fileBuffer);
    }
    catch (err: unknown) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            return res.status(400).send({
                message: 'Database error occurred'
            });
        }

        return res.status(500).send({
            message: 'Internal server error occurred'
        });
    }
}

/**
 * Handles fetching all files for a user
 * 
 * @async
 * @function getUserFilesHandler
 * @param {TypedRequest<GetUserFilesInput>} req - Request containing validated userId in params
 * @param {Response} res - Response to be sent
 * @returns {Promise<Response>} Returns an HTTP response:
 * - `200` with array of user's files
 * - `403` if requesting another user's files
 * - `500` for database errors
 */
export async function getUserFilesHandler(
    req: TypedRequest<GetUserFilesInput>,
    res: Response
): Promise<Response> {
    try {
        const userId: number = Number(req.params.userId);

        if (userId !== res.locals.user.id) {
            return res.status(403).send({
                message: 'You do not have permission to view this resource'
            });
        }

        const files: File[] = await getFilesByUserId(userId);

        return res.status(200).send({
            files: files.map(file => ({
                id: file.id,
                filename: file.fileName,
                mimeType: file.mimeType,
                size: file.size.toString(),
                uploadedAt: file.uploadedAt
            }))
        });
    }
    catch (err: unknown) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            return res.status(400).send({
                message: 'Database error occurred'
            });
        }

        return res.status(500).send({
            message: 'Internal server error occurred'
        });
    }
}

/**
 * Handles deleting a file by fileId
 * 
 * @async
 * @function deleteFileHandler
 * @param {TypedRequest<DeleteFileInput>} req - Request containing validated fileId in params
 * @param {Response} res - Response to be sent
 * @returns {Promise<Response>} Returns an HTTP response:
 * - `200` with success message
 * - `404` if file is not found
 * - `403` if user doesn't own the file
 * - `500` for file system or database errors
 */
export async function deleteFileHandler(
    req: TypedRequest<DeleteFileInput>,
    res: Response
): Promise<Response> {
    try {
        const fileId: number = Number(req.params.fileId);
        const file: File | null = await getFileById(fileId);

        if (!file) {
            return res.status(404).send({
                message: 'File not found'
            });
        }

        if (file.user !== res.locals.user.id) {
            return res.status(403).send({
                message: 'You do not have permission to delete this file'
            });
        }

        await deleteFile(fileId);

        return res.status(200).send({
            message: 'File deleted successfully'
        });
    }
    catch (err: unknown) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            return res.status(400).send({
                message: 'Database error occurred'
            });
        }

        return res.status(500).send({
            message: 'Internal server error occurred'
        });
    }
}