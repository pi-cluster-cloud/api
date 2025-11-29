import { z } from 'zod';

export const getFileSchema = z.object({
    params: z.object({
        fileId: z.string('fileId is required')
            .refine((data) => Number.isInteger(Number(data)) && Number(data) > 0, {
                message: 'fileId must be a positive integer'
            })
    }).strict(),
    body: z.any(),
    query: z.any()
});

export const getUserFilesSchema = z.object({
    params: z.object({
        userId: z.string('userId is required')
            .refine((data) => Number.isInteger(Number(data)) && Number(data) > 0, {
                message: 'userId must be a positive integer'
            })
    }).strict(),
    body: z.any(),
    query: z.any()
});

export const deleteFileSchema = z.object({
    params: z.object({
        fileId: z.string('fileId is required')
            .refine((data) => Number.isInteger(Number(data)) && Number(data) > 0, {
                message: 'fileId must be a positive integer'
            })
    }).strict(),
    body: z.any(),
    query: z.any()
});

export type GetFileInput = z.infer<typeof getFileSchema>;
export type GetUserFilesInput = z.infer<typeof getUserFilesSchema>;
export type DeleteFileInput = z.infer<typeof deleteFileSchema>;