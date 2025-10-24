import {Request, Response, NextFunction} from 'express';
import { getUserById } from '../service/user.service';
import { User } from '@prisma/client';

export async function requireUser(req: Request, res: Response, next: NextFunction) {
    if (!res.locals.user || typeof res.locals.user!.id !== 'number') {
        return res.status(401).send({
            message: 'Valid access token required'
        });
    }
    
    const user: User | null = await getUserById(res.locals.user.id);
    if (user) next();
}