import {Response} from 'express';
import { TypedRequest } from '../utils/typed_request';
import { CreateSessionInput } from '../schema/session.schema';
import { Session, User } from '@prisma/client';
import { createSession, signJwt } from '../service/session.service';
import { getUserById } from '../service/user.service';
import config from 'config';
import {Algorithm} from 'jsonwebtoken';
import { omit } from 'lodash';

/**
 * Handler for creating a session (logging in)
 * 
 * @async
 * @param req {TypedRequest<CreateSessionInput>} - Request containing validated login information in body
 * @param res {Response} - Response to be returned
 * @returns {Promise<Response>} Returns an HTTP response:
 * - `201` (with accessToken) if the session is created successfully
 * - `401` if the login is invalid
 */
export async function createSessionHandler(
    req: TypedRequest<CreateSessionInput>,
    res: Response): Promise<Response> {
        const newSession: Session | null = await createSession(req.body, req.headers['user-agent']);
        if (!newSession) {
            return res.status(401).send({
                message: 'Invalid login'
            });
        }

        // Get user
        const user: User | null = await getUserById(newSession.user);

        // Sign access token
        const payload: object = {
            ...omit(user, 'password'),
            session: newSession.id
        };
        const accessToken: string | null = signJwt(
            payload,
            {
                algorithm: config.get<Algorithm>('jwtAlgorithm'),
                expiresIn: config.get<number>('accessTokenTtl')
            }
        );
        const refreshToken: string | null = signJwt(
            payload,
            {
                algorithm: config.get<Algorithm>('jwtAlgorithm'),
                expiresIn: config.get<number>('refreshTokenTtl')
            }
        );

        if (!accessToken) {
            return res.status(500).send({
                message: 'Internal server error occured'
            });
        }

        return res.status(201).send({
            accessToken,
            refreshToken
        });
}