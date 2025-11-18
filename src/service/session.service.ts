import { Prisma, Session, User } from "@prisma/client";
import { CreateSessionInput } from "../schema/session.schema";
import prisma from "../utils/prisma";
import { getUserById, validateLogin } from "./user.service";
import jwt from 'jsonwebtoken';
import { omit } from "lodash";
import config from 'config';

/**
 * Creates a new session (login)
 * 
 * @async
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
 * Get a session given its id
 * 
 * @async
 * @param {number} sessionId - Id of the session
 * @returns {Promise<Session | null>} - The found session or null if not found
 */
export async function getSessionById(
    sessionId: number
): Promise<Session | null> {
    const select: Prisma.SessionSelect = {
        id: true,
        user: true,
        isValid: true,
        userClient: true,
        createdAt: true,
        updatedAt: true
    };

    const session: Session | null = await prisma.session.findUnique({
        select,
        where: {id: sessionId}
    });
    return session;
}

/**
 * Signs a JsonWebToken
 * 
 * @param payload {object} - Payload to be signed
 * @param options {jwt.SignOptions} - Options for signing behavior
 * @returns {string | null} - Signed JWT or null if an error occured
 */
export function signJwt(payload: object, options: jwt.SignOptions): string | null {
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

export type VerifyJwtResult = {
    isValid: boolean,
    expired: boolean,
    decoded: any
};

/**
 * Verifies and decodes a JsonWebToken
 * 
 * @param {string} token - JWT to be verified and decoded
 * @returns {VerifyJwtResult | null} Verification result if successful or null if error occured
 */
export function verifyJwt(token: string): VerifyJwtResult | null {
    const secret: string | undefined = process.env.JWT_SECRET;
    if (!secret) return null;

    try {
        const decoded = jwt.verify(token, secret);
        return {
            isValid: true,
            expired: false,
            decoded
        }
    } catch(error: any) {
        return {
            isValid: false,
            expired: error.message === 'jwt expired',
            decoded: null
        }
    }
}

export async function reissueAccessToken(refreshToken: string): Promise<string | null> {
    const verified: VerifyJwtResult | null = verifyJwt(refreshToken);
    if (!verified) return null;
    const {decoded} = verified;

    // Invalid token
    if (!decoded) return null;
    if (typeof decoded.session !== 'number') return null;
    
    // Find session
    const session: Session | null = await getSessionById(decoded.session as number);
    if (!session || !session.isValid) return null; // Invalid session

    // Find user
    const user: User | null = await getUserById(session.user);
    if (!user) return null; // Invalid user

    const payload: object = {
        ...omit(user, 'password'),
        session: session.id
    };
    const accessToken: string | null = signJwt(
        payload,
        {
            algorithm: config.get('jwtAlgorithm'),
            expiresIn: config.get('accessTokenTtl')
        }
    );
    
    return accessToken;
}