import express from 'express';
import { createUserHandler, getUserHandler } from './controller/user.controller';
import validateResource from './middleware/validate_resource';
import { createUserSchema, getUserSchema } from './schema/user.schema';
import { createSessionSchema } from './schema/session.schema';
import { createSessionHandler } from './controller/session.controller';

const router = express.Router();

router.post('/users', validateResource(createUserSchema), createUserHandler);
router.get('/users/:userId', validateResource(getUserSchema), getUserHandler);
router.post('/sessions', validateResource(createSessionSchema), createSessionHandler);

export default router;