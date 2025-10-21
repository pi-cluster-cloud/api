import { Response, Request} from 'express';
import { createUser, getUserById, hashPassword } from '../service/user.service';
import {Prisma, User} from '@prisma/client';
import { snakeToCamelCase } from '../utils/string_conversion';
import { CreateUserInput, GetUserInput } from '../schema/user.schema';
import { TypedRequest } from '../utils/typed_request';
import { omit } from 'lodash';

/**
 * Handles the creation of a new user
 *
 * @async
 * @function createUserHandler
 * @param {TypedRequest<CreateUserInput>} req - Request containing validated user creation data in body
 * @param {Response} res - Response to be sent
 * @returns {Promise<Response>} Returns an HTTP response:
 * - `201` with the newly created user object on success
 * - `409` if a unique constraint (phoneNumber, email) fails
 * - `400` for other Prisma client errors
 * - `500` for unknown errors
 */ 
export async function createUserHandler(
    req: TypedRequest<CreateUserInput>, 
    res: Response
) {
    try {
        // Create user
        const hashedPassword = await hashPassword(req.body.password);
        const newUser = await createUser({
            ...req.body, password: hashedPassword
        });
        return res.status(201).send(omit(newUser, 'password')); // Omit password
    }
    catch (err: unknown) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            // Duplicate key with unique constraint
            if (err.code === 'P2002') {
                const duplicate: string = (err.meta?.target as string[])[0];
                return res.status(409).send({
                    message: `${snakeToCamelCase(duplicate)} already taken`
                });
            }

            // Other client database error
            return res.status(400).send({
                message: 'Database error occurred'
            });
        }

        // Unknown error
        return res.status(500).send({
            message: 'Internal server error occured'
        });
    } 
}

/**
 * Handles fetching a user with given userId
 * 
 * @async
 * @function getUserHandler
 * @param req {TypedRequest<GetUserInput>} - Request containing validated userId in params
 * @param res - Response to be sent
 * @returns {Promise<Response>} Returns an HTTP response:
 * - `200` with the user matching userId 
 * - `404` if no user is found
 * - `400` for Prisma client errors
 * - `500` for unknown errors
 */
export async function getUserHandler(
    req: TypedRequest<GetUserInput>,
    res: Response,
): Promise<Response> {
    try {
        const user: User | null = await getUserById(Number(req.params.userId));

        if (!user) {
            return res.status(404).send({
                message: 'User not found'
            });
        }
        return res.status(200).send(omit(user, 'password'));
    }
    catch (err: unknown) {
        // Client database error
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            return res.status(400).send({
                message: `Database error occured`
            });
        }

        // Unknown error
        return res.status(500).send({
            message: 'Internal server error occured'
        });
    }
}