import express from 'express';
import { createUserHandler, getUserHandler } from './controller/user.controller';
import validateResource from './middleware/validate_resource';
import { createUserSchema, getUserSchema } from './schema/user.schema';
import { createSessionSchema } from './schema/session.schema';
import { createSessionHandler } from './controller/session.controller';
import { requireUser } from './middleware/require_user';
import { uploadFile } from './middleware/upload_file';
import { uploadFileHandler } from './controller/file.controller';

const router = express.Router();

router.post('/users', validateResource(createUserSchema), createUserHandler);
router.get('/users/:userId', validateResource(getUserSchema), requireUser, getUserHandler);
router.post('/sessions', validateResource(createSessionSchema), createSessionHandler);
router.post('/files', requireUser, uploadFile.single('file'), uploadFileHandler);

export default router;