import { Prisma, Session, User } from "@prisma/client";
import { CreateSessionInput } from "../schema/session.schema";
import prisma from "../utils/prisma";
import { validateLogin } from "./user.service";
import jwt from 'jsonwebtoken';

/**
 * Creates a new session (login)
 * 
 * @param loginData {CreateSessionInput['body']} - Login data containing (`email` or `phoneNumber`) and `password`
 * @param userClient {string} - Client from which the login request was made
 * @returns Promise<Session | null> - The created session if login was valid, null otherwise
 */
export async function createSession(
    loginData: CreateSessionInput['body'],
    userClient?: string
): Promise<Session | null> {
    const user: Partial<User> | null = await validateLogin(loginData);
    if (!user) return null; // Invalid login

    const newSession: Session = await prisma.session.create({
        data: {
            user: user.id as number,
            userClient,
        }
    });
    return newSession;
}

/**
 * Signs a JsonWebToken
 * 
 * @param payload {object} - Payload to be signed
 * @param options {jwt.SignOptions} - Options for signing behavior
 * @returns {string | null} - Signed JWT or null if an error occured
 * 
 */
export function signJWT(payload: object, options: jwt.SignOptions): string | null {
    const secret: string | undefined = process.env.JWT_SECRET;
    if (!secret) return null;

    try {
        const token: string = jwt.sign(
            payload,
            secret,
            options
        );
        return token;
    }
    catch (err: unknown) {
        return null;
    }
}