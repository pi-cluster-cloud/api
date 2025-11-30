import multer from 'multer';
import config from 'config';

// Use memory storage to keep files in buffer
// The service layer will handle saving to disk
const storage = multer.memoryStorage();

// Configure multer
export const uploadFile = multer({
    storage: storage,
    limits: {
        fileSize: config.get<number>('fileStorage.maxFileSize') // e.g., 10 * 1024 * 1024 for 10MB
    },
    fileFilter: (req, file, cb) => {
        // Optional: Add file type restrictions here
        // For now, accept all file types
        cb(null, true);
        
        // Example: Only allow certain file types
        // const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        // if (allowedMimeTypes.includes(file.mimetype)) {
        //     cb(null, true);
        // } else {
        //     cb(new Error('Invalid file type'));
        // }
    }
});
